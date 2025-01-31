/**
 * Manages analysis history and caching
 */
class HistoryService {
  /**
   * Saves analysis results to history
   * @param {Object} entry - History entry containing url, title, timestamp, and results
   */
  async saveToHistory(entry) {
    try {
      const history = await chrome.storage.local.get('history');
      const updatedHistory = {
        history: [entry, ...(history.history || [])]
      };
      await chrome.storage.local.set(updatedHistory);
      console.log('Saved scan results to history');
    } catch (error) {
      console.error('Error saving to history:', error);
      throw error; // Propagate error for proper handling
    }
  }

  /**
   * Get analysis history
   * @returns {Array} Array of history entries
   */
  async getHistory() {
    try {
      const result = await chrome.storage.local.get('history');
      return result.history || [];
    } catch (error) {
      console.error('Error getting history:', error);
      throw error;
    }
  }

  /**
   * Clear analysis history
   */
  async clearHistory() {
    try {
      await chrome.storage.local.remove('history');
      console.log('History cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

  /**
   * Caches analysis results for future reference
   * @param {string} url - URL of analyzed page
   * @param {Object} results - Analysis results to cache
   */
  async cacheResults(url, results) {
    try {
      const cacheData = {
        timestamp: Date.now(),
        results
      };
      await chrome.storage.local.set({ [url]: cacheData });
    } catch (error) {
      console.error('Error caching results:', error);
      throw error;
    }
  }

  /**
   * Retrieves cached results for a URL
   * @param {string} url - URL to get cached results for
   * @returns {Object|null} Cached results or null if not found
   */
  async getCachedResults(url) {
    try {
      const result = await chrome.storage.local.get(url);
      if (result[url]) {
        const { timestamp, results } = result[url];
        // Check if cache is still valid (24 hours)
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return results;
        }
        // Remove expired cache
        await chrome.storage.local.remove(url);
      }
      return null;
    } catch (error) {
      console.error('Error getting cached results:', error);
      return null;
    }
  }
}

export default HistoryService;
