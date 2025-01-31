import SettingsService from './services/SettingsService';
import BadgeService from './services/BadgeService';
import AnalysisService from './services/AnalysisService';
import HistoryService from './services/HistoryService';

/**
 * Main background service that coordinates all other services
 */
class BackgroundService {
  constructor() {
    this.badgeService = new BadgeService();
    this.settingsService = new SettingsService();
    this.analysisService = new AnalysisService();
    this.historyService = new HistoryService();
    
    // Initialize listeners
    this.initializeListeners();
  }

  async initializeListeners() {
    // Load settings when extension starts
    this.settingsService.loadSettings().then(() => {
      console.log('Settings loaded:', this.settingsService.getSettings());
    });

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });
  }

  /**
   * Helper method to inject content script
   * @param {number} tabId - ID of the tab to inject into
   */
  async injectContentScript(tabId) {
    try {
      // Create a connection to the tab
      const port = await this.connectToTab(tabId);
      
      // First check if content script is already injected by trying to ping it
      try {
        await this.pingContentScript(tabId);
        console.log('Content script already active');
        return; // Script is already injected and responding
      } catch (error) {
        console.log('Content script not responding, injecting...');
      }

      // Inject the content script
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.bundle.js']
      });

      // Wait for script to initialize and verify it's working
      await this.waitForContentScript(tabId);

      console.log('Content script successfully injected and verified');
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw new Error('Failed to inject and verify content script: ' + error.message);
    }
  }

  /**
   * Create a connection to a tab
   * @param {number} tabId - ID of the tab to connect to
   */
  async connectToTab(tabId) {
    try {
      const port = chrome.tabs.connect(tabId, { name: 'content-script-connection' });
      return new Promise((resolve, reject) => {
        port.onDisconnect.addListener(() => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          }
        });
        resolve(port);
      });
    } catch (error) {
      console.error('Failed to connect to tab:', error);
      throw error;
    }
  }

  /**
   * Ping the content script
   * @param {number} tabId - ID of the tab to ping
   */
  async pingContentScript(tabId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Ping timeout')), 500);
      chrome.tabs.sendMessage(tabId, { type: 'ping' }, response => {
        clearTimeout(timeout);
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else if (response === 'pong') {
          resolve();
        } else {
          reject(new Error('Invalid ping response'));
        }
      });
    });
  }

  /**
   * Wait for content script to initialize
   * @param {number} tabId - ID of the tab to wait for
   */
  async waitForContentScript(tabId) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 10;
      const interval = 300;

      const checkScript = async () => {
        try {
          await this.pingContentScript(tabId);
          resolve();
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('Content script failed to initialize after multiple attempts'));
          } else {
            setTimeout(checkScript, interval);
          }
        }
      };

      // Listen for ready signal from content script
      const readyListener = (message, sender) => {
        if (message.type === 'contentScriptReady' && sender.tab.id === tabId) {
          chrome.runtime.onMessage.removeListener(readyListener);
          resolve();
        }
      };
      chrome.runtime.onMessage.addListener(readyListener);

      // Start checking after a short delay
      setTimeout(checkScript, 100);
    });
  }

  /**
   * Extract content from a tab
   * @param {number} tabId - ID of the tab to extract from
   */
  async extractContent(tabId) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Content extraction timed out'));
      }, 10000); // 10 second timeout

      chrome.tabs.sendMessage(tabId, { type: 'extractContent' }, response => {
        clearTimeout(timeout);
        
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        if (!response) {
          reject(new Error('No response from content script'));
          return;
        }

        if (!response.success) {
          reject(new Error(response.error || 'Content extraction failed'));
          return;
        }

        resolve(response.content);
      });
    });
  }

  /**
   * Handle messages from popup
   */
  handleMessage(message, sender, sendResponse) {
    if (message.type === 'analyzeRequest') {
      this.handleAnalysisRequest(message.data.tabId);
    } else if (message.type === 'getHistory') {
      this.historyService.getHistory().then(history => sendResponse(history));
      return true;
    }
  }

  /**
   * Processes analysis requests from the popup
   * @param {number} tabId - ID of the tab to analyze
   */
  async handleAnalysisRequest(tabId) {
    try {
      console.log('Handling analysis request for tab:', tabId);
      await this.badgeService.updateBadge(tabId, 'scanning');

      // Get tab info for history
      const tab = await chrome.tabs.get(tabId);

      // Ensure content script is properly injected
      try {
        await this.injectContentScript(tabId);
      } catch (error) {
        console.error('Failed to initialize analysis:', error);
        throw new Error('Failed to initialize analysis: ' + error.message);
      }

      // Request content extraction with proper error handling
      try {
        const content = await this.extractContent(tabId);
        console.log('Content extracted, analyzing...');
        const results = await this.analyzeContent(content, tabId);
        
        // Save analysis to history
        await this.historyService.saveToHistory({
          url: tab.url,
          title: tab.title,
          timestamp: new Date().toISOString(),
          results: results
        });

        console.log('Analysis complete:', results);
        
        // Send results to popup
        chrome.runtime.sendMessage({
          type: 'analysisComplete',
          data: results
        }).catch(error => console.log('Failed to send results to popup:', error));

      } catch (error) {
        console.error('Content extraction failed:', error);
        await this.badgeService.updateBadge(tabId, 'error');
        throw error;
      }

    } catch (error) {
      console.error('Error in handleAnalysisRequest:', error);
      await this.badgeService.updateBadge(tabId, 'error');
      
      // Send error to popup
      try {
        await chrome.runtime.sendMessage({
          type: 'analysisError',
          data: { 
            error: error.message,
            details: error.stack
          }
        });
      } catch (msgError) {
        console.log('Failed to send error to popup:', msgError);
      }
    }
  }

  /**
   * Analyzes content from a webpage
   * @param {Object} content - Extracted page content
   * @param {number} tabId - ID of the current tab
   */
  async analyzeContent(content, tabId) {
    try {
      if (!content || !content.text) {
        throw new Error('Invalid content received for analysis');
      }

      // Check API keys first
      if (!process.env.GOOGLE_FACT_CHECK_API_KEY) {
        console.error('Google Fact Check API key not configured');
        await this.badgeService.updateBadge(tabId, 'error');
        await chrome.runtime.sendMessage({
          type: 'analysisError',
          data: { error: 'Google Fact Check API key not configured. Please check extension settings.' }
        });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        console.error('Gemini API key not configured');
        await this.badgeService.updateBadge(tabId, 'error');
        await chrome.runtime.sendMessage({
          type: 'analysisError',
          data: { error: 'Gemini API key not configured. Please check extension settings.' }
        });
        return;
      }

      // Get fact check results
      const factCheckResults = await this.analysisService.checkFacts(content.text)
        .catch(error => {
          console.error('Fact check failed:', error);
          return [];  // Continue with empty results if fact check fails
        });

      // Get Gemini analysis
      const geminiAnalysis = await this.analysisService.analyzeWithGemini(content.text);

      // Combine results
      const results = this.analysisService.combineResults(factCheckResults, geminiAnalysis);

      // Update badge with results
      await this.badgeService.updateBadge(tabId, 'result', results.credibilityScore);

      // Save to history and cache
      await this.historyService.saveToHistory(content.url, content.title, results);
      await this.historyService.cacheResults(content.url, results);

      // Send results back to popup
      await chrome.runtime.sendMessage({
        type: 'analysisUpdate',
        data: results
      });

      return results;

    } catch (error) {
      console.error('Analysis failed:', error);
      
      // Create a user-friendly error message
      let errorMessage = 'Analysis failed. ';
      if (error.message.includes('API key')) {
        errorMessage += 'Please check your API keys in the extension settings.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Please check your internet connection.';
      } else {
        errorMessage += 'Please try again later.';
      }
      
      // Update badge and notify popup
      await this.badgeService.updateBadge(tabId, 'error');
      await chrome.runtime.sendMessage({
        type: 'analysisError',
        data: { error: errorMessage }
      });
      
      throw error;
    }
  }
}

// Initialize background service
const backgroundService = new BackgroundService();
