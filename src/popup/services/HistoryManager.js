/**
 * Manages scan history and related operations
 */
export class HistoryManager {
  constructor() {
    this.historyList = document.querySelector('.history-list');
  }

  async saveToHistory(results) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const historyItem = {
        url: tab.url,
        title: tab.title,
        timestamp: new Date().toISOString(),
        results: results
      };

      // Get existing history
      const { scanHistory = [] } = await chrome.storage.local.get('scanHistory');
      
      // Add new item at the beginning
      scanHistory.unshift(historyItem);
      
      // Keep only the last 50 items
      if (scanHistory.length > 50) {
        scanHistory.pop();
      }

      // Save updated history
      await chrome.storage.local.set({ scanHistory });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  async loadHistory() {
    try {
      const { scanHistory = [] } = await chrome.storage.local.get('scanHistory');
      
      if (!this.historyList) return;
      
      this.historyList.innerHTML = '';
      
      if (scanHistory.length === 0) {
        this.historyList.innerHTML = '<div class="empty-history">No scan history available</div>';
        return;
      }

      scanHistory.forEach(item => this.renderHistoryItem(item));
    } catch (error) {
      console.error('Error loading history:', error);
      this.historyList.innerHTML = '<div class="error-message">Error loading history</div>';
    }
  }

  renderHistoryItem(item) {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const date = new Date(item.timestamp).toLocaleString();
    const credibilityScore = item.results.credibilityScore;
    const scoreColor = this.getScoreColor(credibilityScore);

    // Process claims to include fact check links
    const claimsHtml = item.results.claims.map(claim => {
      const claimReview = claim.claimReview && claim.claimReview[0];
      const sourceUrl = claimReview ? claimReview.url : null;
      const sourceName = claimReview && claimReview.publisher ? claimReview.publisher.name : 'Unknown Source';
      const rating = claimReview ? claimReview.textualRating : 'Unknown';

      return `
        <div class="history-claim">
          <div class="claim-text">${claim.text}</div>
          <div class="claim-rating">Rating: ${rating}</div>
          <div class="claim-source">Source: ${sourceName}</div>
          ${sourceUrl ? `
            <div class="source-link">
              <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">
                <span class="source-icon">📰</span>
                Read Full Fact Check
                <span class="arrow">→</span>
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    historyItem.innerHTML = `
      <div class="history-item-header">
        <div class="history-title">${item.title || 'Untitled Page'}</div>
        <div class="history-score" style="color: ${scoreColor}">${credibilityScore}%</div>
      </div>
      <div class="history-url">${item.url}</div>
      <div class="history-date">${date}</div>
      <div class="history-claims">
        ${claimsHtml}
      </div>
    `;
    
    historyItem.addEventListener('click', () => this.openHistoryDetails(item));
    this.historyList.appendChild(historyItem);
  }

  getScoreColor(score) {
    if (score >= 80) return 'var(--success-color)';
    if (score >= 60) return 'var(--warning-color)';
    return 'var(--danger-color)';
  }

  async openHistoryDetails(item) {
    try {
      console.log('[History] Opening history details for item:', item);
      
      const sanitizedItem = this.sanitizeHistoryItem(item);
      const encodedData = this.encodeHistoryData(sanitizedItem);
      
      // Create URL with encoded data
      const baseUrl = chrome.runtime.getURL('history-details.html');
      const url = `${baseUrl}?data=${encodedData}`;
      
      // Open in new tab
      await chrome.tabs.create({ url });
    } catch (error) {
      console.error('[History] Error opening history details:', error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = `Error opening history: ${error.message}`;
      document.body.appendChild(errorDiv);
    }
  }

  sanitizeHistoryItem(item) {
    return {
      url: item.url ? String(item.url) : '',
      title: item.title ? String(item.title).substring(0, 256) : '',
      timestamp: item.timestamp,
      results: {
        credibilityScore: Number(item.results.credibilityScore) || 0,
        claims: Array.isArray(item.results.claims) ? item.results.claims.map(claim => ({
          text: claim.text ? String(claim.text).substring(0, 1024) : '',
          claimant: claim.claimant ? String(claim.claimant).substring(0, 256) : 'Unknown',
          claimDate: claim.claimDate,
          claimReview: Array.isArray(claim.claimReview) ? claim.claimReview.map(review => ({
            publisher: review.publisher ? {
              name: String(review.publisher.name).substring(0, 256),
              site: String(review.publisher.site).substring(0, 256)
            } : null,
            url: review.url ? String(review.url) : null,
            title: review.title ? String(review.title).substring(0, 512) : '',
            reviewDate: review.reviewDate,
            textualRating: review.textualRating ? String(review.textualRating).substring(0, 50) : 'Unknown',
            languageCode: review.languageCode ? String(review.languageCode).substring(0, 10) : 'en'
          })) : []
        })) : [],
        summary: item.results.summary ? String(item.results.summary).substring(0, 2048) : ''
      }
    };
  }

  encodeHistoryData(data) {
    const jsonString = JSON.stringify(data)
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    return btoa(unescape(encodeURIComponent(jsonString)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
