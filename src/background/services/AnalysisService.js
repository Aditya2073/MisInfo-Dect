import ClaimBusterService from './ClaimBusterService';

/**
 * Handles content analysis using Fact Check API and Gemini AI
 */
class AnalysisService {
  constructor() {
    this.claimBusterService = new ClaimBusterService();
  }

  /**
   * Checks facts using multiple fact checking services
   * @param {string} text - Text content to check
   * @returns {Object} Combined fact check results
   */
  async checkFacts(text) {
    try {
      // Run both fact checks in parallel
      const [googleResults, claimBusterResults] = await Promise.all([
        this.checkGoogleFacts(text),
        this.claimBusterService.analyzeClaims(text)
      ]);

      return {
        googleFactCheck: googleResults,
        claimBuster: claimBusterResults,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in fact checking:', error);
      return {
        googleFactCheck: [],
        claimBuster: [],
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Checks facts using Google's Fact Check API
   * @param {string} text - Text content to check
   * @returns {Array} Array of fact check results
   */
  async checkGoogleFacts(text) {
    try {
      // Split text into paragraphs for more accurate fact checking
      const paragraphs = text.split('\n').filter(p => p.trim().length > 50);
      
      // Check each paragraph separately
      const results = await Promise.all(
        paragraphs.map(async paragraph => {
          const params = new URLSearchParams({
            key: process.env.GOOGLE_FACT_CHECK_API_KEY,
            query: paragraph,
            languageCode: 'en'
          });

          const response = await fetch(
            `https://factchecktools.googleapis.com/v1alpha1/claims:search?${params}`
          );

          if (!response.ok) {
            throw new Error(`Fact check API error: ${response.status}`);
          }

          const data = await response.json();
          return data.claims || [];
        })
      );

      // Flatten and deduplicate results
      return this.processFactCheckResults(results);
    } catch (error) {
      console.error('Error checking facts:', error);
      return [];
    }
  }

  /**
   * Process and deduplicate fact check results
   * @param {Array} results - Raw fact check results
   * @returns {Array} Processed fact check results
   */
  processFactCheckResults(results) {
    return results
      .flat()
      .filter((claim, index, self) => 
        index === self.findIndex(c => c.text === claim.text)
      )
      .map(claim => ({
        ...claim,
        source: 'Google Fact Check'
      }));
  }

  /**
   * Analyzes content using Google's Gemini AI
   * @param {string} text - Text content to analyze
   * @returns {Object} AI analysis results
   */
  async analyzeWithGemini(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured in environment');
    }

    try {
      const response = await this.makeGeminiRequest(text, apiKey);
      return this.processGeminiResponse(response);
    } catch (error) {
      console.error('Error analyzing with Gemini:', error);
      throw error;
    }
  }

  /**
   * Makes request to Gemini API
   * @param {string} text - Text to analyze
   * @param {string} apiKey - Gemini API key
   * @returns {Object} Raw API response
   */
  async makeGeminiRequest(text, apiKey) {
    const prompt = this.buildGeminiPrompt(text);
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Builds prompt for Gemini API
   * @param {string} text - Text to analyze
   * @returns {string} Formatted prompt
   */
  buildGeminiPrompt(text) {
    return `You are a credibility analysis expert. Analyze the following text for credibility and provide a response in ONLY valid JSON format (no markdown, no code blocks). Consider:
1. Factual accuracy
2. Source reliability
3. Bias detection
4. Overall credibility

The response must be a single JSON object with exactly these fields:
- credibility_score (number between 0-10)
- total_reviews (number of sources/references found)
- summary (brief analysis text)

Text to analyze:
${text.slice(0, 3000)}`;
  }

  /**
   * Processes Gemini API response
   * @param {Object} data - Raw API response
   * @returns {Object} Processed response
   */
  processGeminiResponse(data) {
    let result = data.candidates[0].content.parts[0].text;
    result = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      return JSON.parse(result);
    } catch (e) {
      console.error('Failed to parse Gemini response:', e);
      throw new Error('Invalid response format from Gemini API');
    }
  }

  /**
   * Combines results from fact checking and AI analysis
   * @param {Object} factCheckResults - Results from fact checking services
   * @param {Object} geminiAnalysis - Results from Gemini AI
   * @returns {Object} Combined analysis results
   */
  combineResults(factCheckResults, geminiAnalysis) {
    const googleClaims = (factCheckResults.googleFactCheck || []).map(claim => ({
      text: claim.text || 'No claim text available',
      claimReview: claim.claimReview || [], // Preserve the claimReview array
      claimDate: claim.claimDate || null,
      claimant: claim.claimant || 'Unknown',
      source: claim.source
    }));

    const claimBusterClaims = (factCheckResults.claimBuster || []).map(claim => ({
      text: claim.text || 'No claim text available',
      claimReview: claim.claimReview || [], // Preserve the claimReview array
      claimDate: claim.claimDate || null,
      claimant: claim.claimant || 'Unknown',
      source: 'ClaimBuster'
    }));

    const claims = [...googleClaims, ...claimBusterClaims];

    const credibilityScore = this.calculateCredibilityScore(claims, geminiAnalysis);

    return {
      credibilityScore,
      claims,
      sourceRating: {
        score: geminiAnalysis.credibility_score,
        totalReviews: geminiAnalysis.total_reviews || 0
      },
      summary: geminiAnalysis.summary
    };
  }

  /**
   * Calculates final credibility score
   * @param {Array} claims - Fact check claims
   * @param {Object} geminiAnalysis - AI analysis results
   * @returns {number} Final credibility score (0-100)
   */
  calculateCredibilityScore(claims, geminiAnalysis) {
    const factCheckWeight = 0.6;
    const geminiWeight = 0.4;

    const factCheckScore = claims.length > 0
      ? claims.reduce((acc, claim) => {
          // Get the first claim review if it exists
          const review = claim.claimReview && claim.claimReview[0];
          if (!review) return acc + 50; // Default score if no review

          const rating = review.textualRating ? review.textualRating.toLowerCase() : '';
          if (rating.includes('true') || rating.includes('accurate')) return acc + 100;
          if (rating.includes('mostly') || rating.includes('partly')) return acc + 50;
          if (rating.includes('false') || rating.includes('inaccurate')) return acc + 0;
          return acc + 50; // Default for unknown ratings
        }, 0) / claims.length
      : 50;

    const finalScore = Math.round(
      (factCheckScore * factCheckWeight) +
      (geminiAnalysis.credibility_score * 10 * geminiWeight)
    );

    return Math.max(0, Math.min(100, finalScore));
  }
}

export default AnalysisService;
