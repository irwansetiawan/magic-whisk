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

  // Aspect ratio buttons — inside a radix popover, selected one has yellow bg
  aspectRatioButtons: '[role="dialog"] button',
} as const;

const ASPECT_RATIO_MAP: Record<string, string> = {
  IMAGE_ASPECT_RATIO_SQUARE: '1:1',
  IMAGE_ASPECT_RATIO_PORTRAIT: '9:16',
  IMAGE_ASPECT_RATIO_LANDSCAPE: '16:9',
};

const YELLOW_BG = 'rgb(251, 223, 65)';
const ASPECT_RATIOS = ['1:1', '9:16', '16:9'];

/** Read the currently selected aspect ratio. Tries localStorage first, falls back to DOM. */
export function getSelectedAspectRatio(): string | null {
  // Primary: read from Whisk's localStorage
  try {
    const raw = localStorage.getItem('BACKBONE_USER_PREFERENCES_STORE');
    if (raw) {
      const parsed = JSON.parse(raw);
      const key = parsed?.state?.selectedAspectRatio;
      const mapped = key ? (ASPECT_RATIO_MAP[key] ?? null) : null;
      if (mapped) return mapped;
    }
  } catch { /* fall through */ }

  // Fallback: check DOM buttons for yellow background
  const buttons = document.querySelectorAll<HTMLButtonElement>(SELECTORS.aspectRatioButtons);
  for (const btn of buttons) {
    const text = btn.textContent?.trim();
    if (!text || !ASPECT_RATIOS.includes(text)) continue;
    if (getComputedStyle(btn).backgroundColor === YELLOW_BG) return text;
  }

  return null;
}
