import { FactCheckRenderer } from './FactCheckRenderer';

/**
 * Manages page scanning and result display
 */
export class ScanManager {
  constructor() {
    this.scanButton = document.getElementById('scan-page');
    this.scanStatus = document.querySelector('.scan-status');
    this.factCheckRenderer = new FactCheckRenderer();
    
    this.initializeScanButton();
  }

  initializeScanButton() {
    if (this.scanButton) {
      this.scanButton.addEventListener('click', () => this.handleScan());
    }
  }

  async handleScan() {
    try {
      this.updateScanStatus('Scanning page...', 'pending');
      
      // Send message to background script to start analysis
      const results = await chrome.runtime.sendMessage({ 
        action: 'analyzePage' 
      });

      if (results.error) {
        throw new Error(results.error);
      }

      // Render fact check results
      this.factCheckRenderer.renderResults(results.factChecks);
      
      // Update credibility score
      this.updateCredibilityMeter(results.credibilityScore);
      
      this.updateScanStatus('Scan complete', 'success');
    } catch (error) {
      console.error('Scan error:', error);
      this.updateScanStatus('Scan failed: ' + error.message, 'error');
    }
  }

  updateScanStatus(message, status) {
    if (this.scanStatus) {
      this.scanStatus.textContent = message;
      this.scanStatus.className = 'scan-status ' + status;
    }
  }

  updateCredibilityMeter(score) {
    const meter = document.querySelector('.meter-fill');
    if (meter) {
      meter.style.width = `${score}%`;
      meter.style.backgroundColor = this.getCredibilityColor(score);
    }
  }

  getCredibilityColor(score) {
    if (score >= 80) return '#28a745'; // Green for high credibility
    if (score >= 60) return '#ffc107'; // Yellow for medium credibility
    return '#dc3545'; // Red for low credibility
  }
}
