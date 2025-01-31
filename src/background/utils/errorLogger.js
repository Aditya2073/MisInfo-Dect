/**
 * Utility for logging errors to a file
 */
class ErrorLogger {
  /**
   * Log an error with timestamp and details
   * @param {string} source - Source of the error (e.g., 'AutoScan', 'ContentScript')
   * @param {Error|string} error - Error object or message
   * @param {Object} additionalInfo - Any additional information to log
   */
  static async logError(source, error, additionalInfo = {}) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : '';
    
    const logEntry = {
      timestamp,
      source,
      error: errorMessage,
      stack: errorStack,
      ...additionalInfo
    };

    const logMessage = JSON.stringify(logEntry, null, 2) + '\n---\n';

    try {
      // Use chrome.storage to append to our log
      const { errorLogs = '' } = await chrome.storage.local.get('errorLogs');
      await chrome.storage.local.set({
        errorLogs: errorLogs + logMessage
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  /**
   * Get all logged errors
   * @returns {string} All error logs
   */
  static async getErrorLogs() {
    try {
      const { errorLogs = '' } = await chrome.storage.local.get('errorLogs');
      return errorLogs;
    } catch (e) {
      console.error('Failed to get error logs:', e);
      return '';
    }
  }

  /**
   * Clear all error logs
   */
  static async clearErrorLogs() {
    try {
      await chrome.storage.local.remove('errorLogs');
    } catch (e) {
      console.error('Failed to clear error logs:', e);
    }
  }
}

export default ErrorLogger;
