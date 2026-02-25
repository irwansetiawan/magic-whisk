// Whisk DOM selectors — update these if Whisk changes its UI
export const SELECTORS = {
  // The main textarea where prompts are entered
  promptInput: 'textarea[placeholder*="Describe your idea"]',

  // The submit/generate button
  generateButton: 'button[aria-label="Submit prompt"]',

  // Generated result images — Whisk uses blob URLs for rendered images
  resultImage: 'img[src^="blob:"]',

  // Loading indicator — Whisk uses a Lottie animation inside this container
  loadingIndicator: '.lf-player-container',

  // Error message element
  // TODO: Inspect error states on Whisk and refine this selector
  errorMessage: '[role="alert"]',
} as const;
