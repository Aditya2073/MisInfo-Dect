// Keep track of port connection status
let isConnected = true;

// Listen for disconnect events
chrome.runtime.onConnect.addListener((port) => {
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected');
    isConnected = false;
  });
});

// Immediately set up message listener to handle ping requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Always respond to ping messages immediately
  if (message.type === 'ping') {
    console.log('Content script received ping');
    sendResponse('pong');
    return true;
  }
});

class ContentExtractor {
  constructor() {
    this.isInitialized = false;
    this.initializationPromise = this.initialize();
  }

  async initialize() {
    try {
      // Wait for DOM to be ready
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          const handler = () => {
            if (document.readyState === 'complete') {
              document.removeEventListener('readystatechange', handler);
              resolve();
            }
          };
          document.addEventListener('readystatechange', handler);
        });
      }

      // Set up message listener for content extraction
      this.setupMessageListener();
      
      // Signal that initialization is complete
      this.isInitialized = true;
      console.log('Content script initialized successfully');
      
      // Notify background script that we're ready
      this.sendReadySignal();
    } catch (error) {
      console.error('Failed to initialize content script:', error);
      this.isInitialized = false;
    }
  }

  async sendReadySignal(retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        await chrome.runtime.sendMessage({ 
          type: 'contentScriptReady',
          url: window.location.href
        });
        console.log('Sent ready signal to background script');
        return;
      } catch (error) {
        console.log(`Failed to send ready signal (attempt ${i + 1}):`, error);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'extractContent') {
        // Log the request
        console.log('Received content extraction request');
        
        // Create a promise to handle the extraction
        const extractionPromise = new Promise(async (resolve) => {
          try {
            if (!this.isInitialized) {
              throw new Error('Content script not initialized');
            }

            const content = await this.extractPageContent();
            console.log('Content extracted successfully');
            resolve({ success: true, content });
          } catch (error) {
            console.error('Error extracting content:', error);
            resolve({ success: false, error: error.message });
          }
        });

        // Handle the extraction with timeout
        extractionPromise.then(response => {
          if (isConnected) {
            sendResponse(response);
          }
        });

        return true; // Keep the message channel open
      }
    });
  }

  async extractPageContent() {
    try {
      // Get metadata
      const metadata = await this.getMetadata();

      // Get text content from all relevant elements
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, article, .post-content, .tweet-text');
      const textContent = Array.from(textElements)
        .filter(element => !this.isHidden(element))
        .map(element => {
          const text = element.textContent.trim();
          
          // Add extra weight to headers and article titles
          if (element.tagName.match(/^H[1-6]$/) || 
              element.classList.contains('article-title') || 
              element.classList.contains('post-title')) {
            return text + ' ' + text;
          }
          
          return text;
        })
        .filter(text => text.length > 50) // Only keep substantial paragraphs
        .join('\n');

      return {
        url: window.location.href,
        title: document.title,
        text: textContent,
        metadata
      };
    } catch (error) {
      console.error('Error in extractPageContent:', error);
      throw error;
    }
  }

  async getMetadata() {
    try {
      const metadata = {};

      // Get Open Graph metadata
      const ogTags = document.querySelectorAll('meta[property^="og:"]');
      ogTags.forEach(tag => {
        const property = tag.getAttribute('property').replace('og:', '');
        metadata[property] = tag.getAttribute('content');
      });

      // Get schema.org metadata
      const schemaJson = document.querySelector('script[type="application/ld+json"]');
      if (schemaJson) {
        try {
          const schemaData = JSON.parse(schemaJson.textContent);
          metadata.schema = schemaData;
        } catch (e) {
          console.error('Failed to parse schema.org data:', e);
        }
      }

      // Get author information
      const authorMeta = document.querySelector('meta[name="author"]');
      if (authorMeta) {
        metadata.author = authorMeta.getAttribute('content');
      }

      // Get publication date
      const dateMeta = document.querySelector('meta[property="article:published_time"]');
      if (dateMeta) {
        metadata.publishedTime = dateMeta.getAttribute('content');
      }

      return metadata;
    } catch (error) {
      console.error('Error in getMetadata:', error);
      return {};
    }
  }

  isHidden(element) {
    try {
      const style = window.getComputedStyle(element);
      return style.display === 'none' || 
             style.visibility === 'hidden' || 
             style.opacity === '0' ||
             element.offsetParent === null;
    } catch (error) {
      console.error('Error in isHidden:', error);
      return true;
    }
  }
}

// Initialize content extractor
console.log('Starting content script initialization');
const extractor = new ContentExtractor();
