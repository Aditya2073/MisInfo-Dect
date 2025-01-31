/**
 * Manages extension settings in the popup
 */
export class SettingsManager {
  constructor() {
    this.autoScanToggle = document.getElementById('autoScanEnabled');
    this.googleApiStatus = document.getElementById('google-api-status');
    this.geminiApiStatus = document.getElementById('gemini-api-status');
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    if (this.autoScanToggle) {
      this.autoScanToggle.addEventListener('change', async (e) => {
        try {
          const settings = { autoScanEnabled: e.target.checked };
          await chrome.storage.sync.set({ settings });
          
          // Notify background script of setting change
          await chrome.runtime.sendMessage({
            type: 'SETTINGS_UPDATED',
            settings: settings
          });
        } catch (error) {
          console.error('Error saving auto-scan setting:', error);
        }
      });
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get('settings');
      const settings = result.settings || { autoScanEnabled: true };
      
      if (this.autoScanToggle) {
        this.autoScanToggle.checked = settings.autoScanEnabled;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async checkApiStatus() {
    // Check if environment variables are set
    const googleApiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Update status indicators
    if (this.googleApiStatus) {
      this.googleApiStatus.className = 'status-indicator ' + (googleApiKey ? 'active' : 'inactive');
    }
    if (this.geminiApiStatus) {
      this.geminiApiStatus.className = 'status-indicator ' + (geminiApiKey ? 'active' : 'inactive');
    }

    return {
      googleApiKey: !!googleApiKey,
      geminiApiKey: !!geminiApiKey
    };
  }
}
