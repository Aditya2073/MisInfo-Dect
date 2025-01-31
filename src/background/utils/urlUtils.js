/**
 * Utility functions for URL handling
 */

/**
 * Determines if a URL should be scanned based on its protocol
 * Excludes chrome://, chrome-extension://, about:, and file:// URLs
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL should be scanned
 */
export function shouldScanUrl(url) {
  return url && 
         !url.startsWith('chrome://') && 
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('about:') &&
         !url.startsWith('file://') &&
         url !== 'about:blank' &&
         url !== 'about:newtab';
}
