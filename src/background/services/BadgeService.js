/**
 * Manages the extension badge UI
 */
class BadgeService {
  /**
   * Updates the extension badge with current analysis status
   * @param {number} tabId - ID of the current tab
   * @param {string} state - Current state (scanning/error/result)
   * @param {number} score - Credibility score (if state is result)
   */
  async updateBadge(tabId, state, score = null) {
    try {
      let text = '';
      let color = '';
      let title = '';

      switch (state) {
        case 'scanning':
          text = '⟳';
          color = '#4285f4'; // Blue
          title = 'Scanning page for misinformation...';
          break;
        case 'error':
          text = '✕';
          color = '#757575'; // Gray
          title = 'Error scanning page';
          break;
        case 'result':
          if (score < 60) {
            text = '!';
            color = '#f44336'; // Red
            title = `Low credibility: ${score}%`;
          } else if (score < 80) {
            text = '?';
            color = '#ff9800'; // Orange
            title = `Medium credibility: ${score}%`;
          } else {
            text = '✓';
            color = '#4caf50'; // Green
            title = `High credibility: ${score}%`;
          }
          break;
      }

      await Promise.all([
        chrome.action.setBadgeText({ text, tabId }),
        chrome.action.setBadgeBackgroundColor({ color, tabId }),
        chrome.action.setTitle({ title, tabId })
      ]);
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }
}

export default BadgeService;
