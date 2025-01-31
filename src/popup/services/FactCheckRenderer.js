/**
 * Service for rendering fact check results in the popup
 */
export class FactCheckRenderer {
  constructor() {
    this.googleFactCheckContainer = document.querySelector('.google-fact-check');
    this.claimBusterContainer = document.querySelector('.claimbuster-results');
  }

  /**
   * Render all fact check results
   * @param {Object} results - Combined results from all fact checking services
   */
  renderResults(results) {
    if (!results) return;

    this.renderGoogleFactChecks(results.googleFactCheck || []);
    this.renderClaimBusterResults(results.claimBuster || []);
  }

  /**
   * Render Google Fact Check results
   * @param {Array} googleResults - Results from Google Fact Check API
   */
  renderGoogleFactChecks(googleResults) {
    if (!this.googleFactCheckContainer) return;

    if (googleResults.length === 0) {
      this.googleFactCheckContainer.innerHTML = '<p class="no-results">No fact checks found from Google</p>';
      return;
    }

    const resultsHtml = googleResults.map(result => this.createGoogleFactCheckHtml(result)).join('');
    this.googleFactCheckContainer.innerHTML = `
      <h4>Google Fact Check Results</h4>
      ${resultsHtml}
    `;
  }

  /**
   * Render ClaimBuster results
   * @param {Array} claimBusterResults - Results from ClaimBuster API
   */
  renderClaimBusterResults(claimBusterResults) {
    if (!this.claimBusterContainer) return;

    if (claimBusterResults.length === 0) {
      this.claimBusterContainer.innerHTML = '<p class="no-results">No claims detected by ClaimBuster</p>';
      return;
    }

    const resultsHtml = claimBusterResults.map(result => this.createClaimBusterHtml(result)).join('');
    this.claimBusterContainer.innerHTML = `
      <h4>ClaimBuster Analysis</h4>
      ${resultsHtml}
    `;
  }

  /**
   * Create HTML for a Google fact check result
   * @param {Object} result - Single Google fact check result
   * @returns {string} HTML string
   */
  createGoogleFactCheckHtml(result) {
    const reviews = result.claimReview || [];
    const reviewsHtml = reviews.map(review => `
      <div class="review-item">
        <span class="publisher">${review.publisher?.name || 'Unknown Publisher'}</span>
        <span class="rating">${review.textualRating || 'No rating'}</span>
      </div>
    `).join('');

    return `
      <div class="fact-check-item">
        <div class="fact-check-text">${result.text}</div>
        <div class="fact-check-source">
          <span>Source: ${result.claimant || 'Unknown'}</span>
          ${result.claimDate ? `<span>Date: ${new Date(result.claimDate).toLocaleDateString()}</span>` : ''}
        </div>
        <div class="reviews">${reviewsHtml}</div>
      </div>
    `;
  }

  /**
   * Create HTML for a ClaimBuster result
   * @param {Object} result - Single ClaimBuster result
   * @returns {string} HTML string
   */
  createClaimBusterHtml(result) {
    const confidenceClass = this.getConfidenceClass(result.score);
    
    return `
      <div class="fact-check-item ${confidenceClass}">
        <div class="fact-check-text">${result.text}</div>
        <div class="fact-check-source">
          <span>Claim Score: </span>
          <span class="fact-check-score">${Math.round(result.score * 100)}%</span>
          <span>${this.getClaimDescription(result.score)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Get confidence class based on score
   * @param {number} score - ClaimBuster score
   * @returns {string} CSS class name
   */
  getConfidenceClass(score) {
    if (score >= 0.8) return 'high-confidence';
    if (score >= 0.6) return 'medium-confidence';
    return 'low-confidence';
  }

  /**
   * Get human-readable description of claim score
   * @param {number} score - ClaimBuster score
   * @returns {string} Description
   */
  getClaimDescription(score) {
    if (score >= 0.8) return 'Strong Claim';
    if (score >= 0.6) return 'Moderate Claim';
    return 'Weak Claim';
  }
}
