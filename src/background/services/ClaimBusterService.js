/**
 * Service for interacting with the ClaimBuster API
 */
class ClaimBusterService {
  constructor() {
    this.API_KEY = process.env.CLAIMBUSTER_API_KEY;
    this.BASE_URL = 'https://idir.uta.edu/claimbuster/api/v2';
  }

  /**
   * Check if a piece of text contains claims worth fact-checking
   * @param {string} text - Text to analyze
   * @returns {Promise<Array>} Array of claims and their scores
   */
  async analyzeClaims(text) {
    try {
      const response = await fetch(`${this.BASE_URL}/score/text/`, {
        method: 'POST',
        headers: {
          'x-api-key': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`ClaimBuster API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processClaimBusterResults(data);
    } catch (error) {
      console.error('Error analyzing claims:', error);
      return [];
    }
  }

  /**
   * Process raw ClaimBuster results into a standardized format
   * @param {Object} data - Raw API response
   * @returns {Array} Processed claims
   */
  processClaimBusterResults(data) {
    if (!data || !data.results) {
      return [];
    }

    return data.results
      .filter(result => result.score >= 0.5) // Only include claims with significant scores
      .map(result => ({
        text: result.text,
        score: result.score,
        source: 'ClaimBuster',
        confidence: Math.round(result.score * 100),
        type: this.getClaimType(result.score)
      }));
  }

  /**
   * Determine claim type based on ClaimBuster score
   * @param {number} score - ClaimBuster score
   * @returns {string} Claim type classification
   */
  getClaimType(score) {
    if (score >= 0.8) return 'STRONG_CLAIM';
    if (score >= 0.6) return 'MODERATE_CLAIM';
    return 'WEAK_CLAIM';
  }
}

export default ClaimBusterService;
