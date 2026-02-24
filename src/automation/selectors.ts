// src/automation/selectors.ts

// NOTE: These selectors must be verified against Whisk's live DOM.
// Inspect the page and update as needed.
export const SELECTORS = {
  // The main text input/textarea where prompts are entered
  promptInput: 'textarea[aria-label="Describe your image"]',

  // The generate/create button
  generateButton: 'button[aria-label="Create"]',

  // The container where generated images appear
  resultContainer: '[data-test-id="generated-images"]',

  // Individual result image elements
  resultImage: 'img[data-test-id="generated-image"]',

  // Loading/progress indicator
  loadingIndicator: '[data-test-id="loading"]',

  // Error message element
  errorMessage: '[data-test-id="error-message"]',
} as const;
