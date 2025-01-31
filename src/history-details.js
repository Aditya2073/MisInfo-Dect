console.log('[History Details] Script loaded');

// Initialize content div
let container;

function initializeContainer() {
  console.log('[History Details] Initializing container');
  container = document.getElementById('details-content');
  if (!container) {
    console.error('[History Details] Container element not found');
    return false;
  }
  console.log('[History Details] Container initialized successfully');
  return true;
}

function showError(message, details = '') {
  console.error('[History Details] Error:', message, details);
  if (!container) {
    console.error('[History Details] Cannot show error - container not initialized');
    return;
  }
  container.innerHTML = `
    <div class="error-message">
      <h3>Error</h3>
      <div>${message}</div>
      ${details ? `<div class="debug-info">${details}</div>` : ''}
    </div>
  `;
}

function showDebugInfo(message) {
  console.log('[History Details] Debug:', message);
  if (!container) {
    console.error('[History Details] Cannot show debug info - container not initialized');
    return;
  }
  const debugDiv = document.createElement('div');
  debugDiv.className = 'debug-info';
  debugDiv.textContent = message;
  container.appendChild(debugDiv);
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--success-color)';
  if (score >= 60) return 'var(--warning-color)';
  return 'var(--danger-color)';
}

function displayHistoryDetails(item) {
  console.log('[History Details] Displaying details for item:', JSON.stringify(item, null, 2));
  
  try {
    if (!container) {
      throw new Error('Container not initialized');
    }

    // Clear any debug info
    container.innerHTML = '';
    
    // Add header information
    console.log('[History Details] Adding header');
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
      <h1 class="title">${item.title || 'Untitled Page'}</h1>
      <div class="url">${item.url}</div>
      <div class="date">Scanned on ${new Date(item.timestamp).toLocaleString()}</div>
    `;
    container.appendChild(header);

    // Add credibility score
    console.log('[History Details] Adding credibility score');
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'score-container';
    const scoreColor = getScoreColor(item.results.credibilityScore);
    scoreDiv.innerHTML = `
      <h3>Credibility Score</h3>
      <div class="meter">
        <div class="meter-fill" style="width: ${item.results.credibilityScore}%; background: ${scoreColor}"></div>
        <span class="meter-text">${item.results.credibilityScore}%</span>
      </div>
    `;
    container.appendChild(scoreDiv);

    // Add claims section
    if (item.results.claims && item.results.claims.length > 0) {
      console.log('[History Details] Adding claims section');
      const claimsDiv = document.createElement('div');
      claimsDiv.className = 'claims-container';
      claimsDiv.innerHTML = '<h3>Fact Check Results</h3>';

      // Group claims by source
      const claimsBySource = {};
      item.results.claims.forEach(claim => {
        const source = claim.source || 'Unknown Source';
        if (!claimsBySource[source]) {
          claimsBySource[source] = [];
        }
        claimsBySource[source].push(claim);
      });

      // Display claims grouped by source
      Object.entries(claimsBySource).forEach(([source, claims]) => {
        const sourceDiv = document.createElement('div');
        sourceDiv.className = 'source-group';
        sourceDiv.innerHTML = `<div class="source-name">${source}</div>`;

        claims.forEach(claim => {
          const claimDiv = document.createElement('div');
          claimDiv.className = 'claim-item';
          claimDiv.innerHTML = `
            <div class="claim-text">${claim.text}</div>
            <div class="claim-rating">${claim.rating}</div>
            ${claim.sourceUrl ? `<a href="${claim.sourceUrl}" target="_blank" class="claim-source">View Source</a>` : ''}
          `;
          sourceDiv.appendChild(claimDiv);
        });

        claimsDiv.appendChild(sourceDiv);
      });

      container.appendChild(claimsDiv);
    } else {
      console.log('[History Details] No claims to display');
    }

    // Add summary section
    if (item.results.summary) {
      console.log('[History Details] Adding summary section');
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'summary-card';
      summaryDiv.innerHTML = `
        <h3>Analysis Summary</h3>
        <div>${item.results.summary}</div>
      `;
      container.appendChild(summaryDiv);
    } else {
      console.log('[History Details] No summary to display');
    }
  } catch (error) {
    console.error('[History Details] Error in displayHistoryDetails:', error);
    showError('Error displaying history details', error.toString());
  }
}

function initializeHistoryDetails() {
  console.log('[History Details] Initializing history details');
  
  try {
    if (!initializeContainer()) {
      throw new Error('Failed to initialize container');
    }

    const urlParams = new URLSearchParams(window.location.search);
    const encodedData = urlParams.get('data');
    
    if (!encodedData) {
      throw new Error('No history data found in URL parameters');
    }

    // Decode URL-safe base64 data
    let jsonString;
    try {
      // Convert URL-safe base64 back to regular base64
      const base64 = encodedData
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      
      // Add back padding if needed
      const pad = base64.length % 4;
      const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
      
      // Decode base64 to text
      const decoded = atob(paddedBase64);
      jsonString = decodeURIComponent(escape(decoded));
    } catch (e) {
      throw new Error('Failed to decode data: ' + e.message);
    }

    // Parse JSON with error handling
    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Failed to parse history data: ' + e.message);
    }

    // Validate required data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid history data format: data is not an object');
    }
    if (!data.results || typeof data.results !== 'object') {
      throw new Error('Invalid history data format: missing results');
    }

    displayHistoryDetails(data);
  } catch (error) {
    console.error('[History Details] Error:', error);
    showError('Error processing history data', error.message);
  }
}

// Call the initialization function when the document is ready
console.log('[History Details] Adding DOMContentLoaded listener');
document.addEventListener('DOMContentLoaded', () => {
  console.log('[History Details] DOMContentLoaded event fired');
  initializeHistoryDetails();
});
