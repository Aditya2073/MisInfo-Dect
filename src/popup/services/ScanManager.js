/**
 * Manages page scanning and result display
 */
export class ScanManager {
  constructor() {
    this.scanButton = document.getElementById('scan-page');
    this.scanStatus = document.querySelector('.scan-status');
    this.resultsDiv = document.getElementById('results');
    this.credibilityMeter = document.querySelector('.meter-fill');
    this.claimVerification = document.querySelector('.google-fact-check');
    this.sourceRating = document.querySelector('.source-rating');
    this.summaryCard = document.querySelector('.summary-card');
    this.analysisTimeout = null;
  }

  async handleScan() {
    try {
      // Disable scan button and show scanning state
      this.scanButton.disabled = true;
      this.scanStatus.textContent = 'Analyzing page...';
      this.scanStatus.style.color = '#666';
      this.resetResults();

      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Request analysis
      await chrome.runtime.sendMessage({
        type: 'analyzeRequest',
        data: { tabId: tab.id }
      });

      // Start a timeout to show error if analysis takes too long
      this.analysisTimeout = setTimeout(() => {
        this.showError('Analysis timed out. Please try again.');
        this.scanButton.disabled = false;
      }, 30000); // 30 second timeout

    } catch (error) {
      this.showError('Failed to start analysis: ' + error.message);
      this.scanButton.disabled = false;
    }
  }

  resetResults() {
    this.credibilityMeter.style.width = '0%';
    this.claimVerification.innerHTML = '';
    this.sourceRating.innerHTML = '';
    this.summaryCard.innerHTML = '';
    this.resultsDiv.innerHTML = '';
  }

  showError(message) {
    this.scanButton.disabled = false;
    this.scanStatus.textContent = message;
    this.scanStatus.style.color = 'var(--danger-color)';
  }

  updateAnalysisResults(results) {
    const { credibilityScore, claims, sourceRating, summary } = results;

    // Enable scan button
    this.scanButton.disabled = false;
    this.scanStatus.textContent = 'Analysis complete';
    this.scanStatus.style.color = '#666';

    // Update credibility meter
    this.credibilityMeter.style.width = `${credibilityScore}%`;
    this.credibilityMeter.style.background = this.getScoreColor(credibilityScore);

    // Update results display
    this.updateResults(results);
  }

  updateResults(results) {
    this.resultsDiv.innerHTML = '';
    this.addCredibilityScore(results);
    this.addClaimsSection(results);
    this.addAiAnalysis(results);
  }

  addCredibilityScore(results) {
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'score-container';
    scoreDiv.innerHTML = `
      <h3>Credibility Score</h3>
      <div class="meter">
        <div class="meter-fill" style="width: ${results.credibilityScore}%"></div>
        <span class="meter-text">${results.credibilityScore}%</span>
      </div>
    `;
    this.resultsDiv.appendChild(scoreDiv);
  }

  addClaimsSection(results) {
    if (!results.claims || results.claims.length === 0) {
      this.addNoClaimsMessage();
      return;
    }

    const claimsDiv = document.createElement('div');
    claimsDiv.className = 'claims-container';
    claimsDiv.innerHTML = '<h3>Fact Check Results</h3>';

    // Group claims by source
    const claimsBySource = this.groupClaimsBySource(results.claims);
    this.renderClaimGroups(claimsBySource, claimsDiv);

    this.resultsDiv.appendChild(claimsDiv);
  }

  addNoClaimsMessage() {
    const noClaimsDiv = document.createElement('div');
    noClaimsDiv.className = 'claims-container no-claims';
    noClaimsDiv.innerHTML = `
      <h3>Fact Check Results</h3>
      <div class="no-claims-message">
        <p>No fact checks were found for the content on this page.</p>
        <p class="tip">This could mean:</p>
        <ul>
          <li>The content is too recent to have been fact-checked</li>
          <li>The claims are not controversial or widely circulated</li>
          <li>The content may need to be reviewed by fact-checkers</li>
        </ul>
      </div>
    `;
    this.resultsDiv.appendChild(noClaimsDiv);
  }

  groupClaimsBySource(claims) {
    const claimsBySource = {};
    claims.forEach(claim => {
      const source = claim.source || 'Unknown Source';
      if (!claimsBySource[source]) {
        claimsBySource[source] = [];
      }
      claimsBySource[source].push(claim);
    });
    return claimsBySource;
  }

  renderClaimGroups(claimsBySource, container) {
    Object.entries(claimsBySource).forEach(([source, claims]) => {
      const sourceDiv = document.createElement('div');
      sourceDiv.className = 'source-group';
      sourceDiv.innerHTML = `<h4 class="source-header">${source}</h4>`;

      claims.forEach(claim => {
        sourceDiv.appendChild(this.createClaimCard(claim));
      });

      container.appendChild(sourceDiv);
    });
  }

  createClaimCard(claim) {
    const claimDiv = document.createElement('div');
    claimDiv.className = 'claim-card';
    
    const claimDate = claim.claimDate ? new Date(claim.claimDate).toLocaleDateString() : 'Unknown';
    const reviewDate = claim.reviewDate ? new Date(claim.reviewDate).toLocaleDateString() : 'Unknown';
    
    // Get the source URL and name from claimReview
    const claimReview = claim.claimReview && claim.claimReview[0];
    const sourceUrl = claimReview ? claimReview.url : null;
    const sourceName = claimReview && claimReview.publisher ? claimReview.publisher.name : 'Unknown Source';
    
    claimDiv.innerHTML = `
      <div class="claim-text">${claim.text}</div>
      ${claimReview && claimReview.title ? `<div class="claim-title">${claimReview.title}</div>` : ''}
      <div class="claim-rating ${this.getRatingClass(claimReview ? claimReview.textualRating : 'Unknown')}">
        Rating: ${claimReview ? claimReview.textualRating : 'Unknown'}
      </div>
      <div class="claim-details">
        <p><strong>Claimed by:</strong> ${claim.claimant || 'Unknown'}</p>
        <p><strong>Claim Date:</strong> ${claimDate}</p>
        <p><strong>Review Date:</strong> ${reviewDate}</p>
        <p><strong>Source:</strong> ${sourceName}</p>
      </div>
      ${sourceUrl ? `
        <div class="source-link">
          <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">
            <span class="source-icon">📰</span>
            Read Full Fact Check
            <span class="arrow">→</span>
          </a>
        </div>
      ` : ''}
    `;
    return claimDiv;
  }

  addAiAnalysis(results) {
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'summary-container';
    summaryDiv.innerHTML = `
      <h3>AI Analysis</h3>
      <div class="summary-text">${results.summary}</div>
    `;
    this.resultsDiv.appendChild(summaryDiv);
  }

  getRatingClass(rating) {
    rating = rating.toLowerCase();
    if (rating.includes('true') || rating.includes('accurate')) return 'rating-true';
    if (rating.includes('false') || rating.includes('inaccurate')) return 'rating-false';
    if (rating.includes('mostly') || rating.includes('partly')) return 'rating-mixed';
    return 'rating-unknown';
  }

  getScoreColor(score) {
    if (score >= 80) return 'var(--success-color)';
    if (score >= 60) return 'var(--warning-color)';
    return 'var(--danger-color)';
  }
}
