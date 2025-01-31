/**
 * Service for managing extension settings
 */
export default class SettingsService {
  constructor() {
    this.settings = {
      googleApiKey: '',
      geminiApiKey: ''
    };
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
      console.log('Settings loaded:', this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await chrome.storage.local.set({ settings: this.settings });
      console.log('Settings saved:', this.settings);
      
      // Notify that settings have changed
      chrome.runtime.sendMessage({
        type: 'settingsChanged',
        data: this.settings
      }).catch(() => {}); // Ignore if no listeners
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Get current settings
   */
  getSettings() {
    return this.settings;
  }

  /**
   * Update settings
   * @param {Object} newSettings - New settings to merge with existing ones
   */
  async updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    await this.saveSettings();
  }

  /**
   * Check if APIs are properly configured
   */
  async checkApiStatus() {
    return {
      googleApiKey: !!this.settings.googleApiKey,
      geminiApiKey: !!this.settings.geminiApiKey
    };
  }
}
