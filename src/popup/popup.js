import './popup.css';
import { TabManager } from './services/TabManager';
import { HistoryManager } from './services/HistoryManager';
import { SettingsManager } from './services/SettingsManager';
import { ScanManager } from './services/ScanManager';

/**
 * Main popup manager that coordinates all services
 */
class PopupManager {
  constructor() {
    // Initialize services
    this.tabManager = new TabManager();
    this.historyManager = new HistoryManager();
    this.settingsManager = new SettingsManager();
    this.scanManager = new ScanManager();

    this.initialize();
  }

  async initialize() {
    try {
      // Initialize components
      await this.initializeComponents();
      
      // Set up message listeners
      this.initializeMessageListeners();
      
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }

  async initializeComponents() {
    // Load history
    await this.historyManager.loadHistory();
    
    // Load settings
    await this.settingsManager.loadSettings();
    
    // Check API status and update scan button
    const apiStatus = await this.settingsManager.checkApiStatus();
    this.updateScanButtonState(apiStatus);

    // Add tab change listener for history
    this.tabManager.tabs.forEach(tab => {
      if (tab.dataset.tab === 'history') {
        tab.addEventListener('click', () => this.historyManager.loadHistory());
      }
    });

    // Add scan button listener
    if (this.scanManager.scanButton) {
      this.scanManager.scanButton.addEventListener('click', () => 
        this.scanManager.handleScan()
      );
    }

    this.downloadLogsButton = document.getElementById('downloadLogs');
    if (this.downloadLogsButton) {
      this.downloadLogsButton.addEventListener('click', async () => {
        try {
          const errorLogs = await chrome.runtime.sendMessage({ type: 'getErrorLogs' });
          if (errorLogs) {
            // Create blob and download
            const blob = new Blob([errorLogs], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `misinfo-detective-errors-${new Date().toISOString()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } else {
            console.log('No error logs found');
          }
        } catch (error) {
          console.error('Failed to download error logs:', error);
        }
      });
    }
  }

  updateScanButtonState(apiStatus) {
    const { googleApiKey, geminiApiKey } = apiStatus;
    if (this.scanManager.scanButton) {
      this.scanManager.scanButton.disabled = !(googleApiKey && geminiApiKey);
      if (!googleApiKey || !geminiApiKey) {
        this.scanManager.scanStatus.textContent = 'Please configure API keys to enable scanning';
      }
    }
  }

  initializeMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Clear timeout if it exists
      if (this.scanManager.analysisTimeout) {
        clearTimeout(this.scanManager.analysisTimeout);
        this.scanManager.analysisTimeout = null;
      }

      if (message.type === 'analysisUpdate') {
        console.log('Received analysis results:', message.data);
        this.scanManager.updateAnalysisResults(message.data);
        this.historyManager.saveToHistory(message.data);
      } else if (message.type === 'analysisError') {
        console.error('Analysis error:', message.data.error);
        this.scanManager.showError(message.data.error);
      }
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing PopupManager...');
  window.popupManager = new PopupManager();
});
