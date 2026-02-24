import { SELECTORS } from './selectors';
import { waitForElement, waitForElementRemoved } from './observer';

export interface GenerationResult {
  imageUrl: string;
}

async function injectPrompt(prompt: string): Promise<void> {
  const input = await waitForElement(SELECTORS.promptInput, { timeout: 10000 });
  const el = input as HTMLTextAreaElement;

  el.focus();
  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true }));

  el.value = prompt;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

async function clickGenerate(): Promise<void> {
  const button = await waitForElement(SELECTORS.generateButton, { timeout: 10000 });
  (button as HTMLButtonElement).click();
}

async function waitForResult(existingImages: Set<string>): Promise<GenerationResult> {
  try {
    await waitForElement(SELECTORS.loadingIndicator, { timeout: 5000 });
  } catch {
    // Loading may have already started and finished
  }

  await waitForElementRemoved(SELECTORS.loadingIndicator, { timeout: 120000 });

  const error = document.querySelector(SELECTORS.errorMessage);
  if (error) {
    throw new Error(`Generation failed: ${error.textContent?.trim() || 'Unknown error'}`);
  }

  // Wait for a NEW image that wasn't in the DOM before generation
  const imageUrl = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      observer.disconnect();
      reject(new Error('Timeout waiting for new generated image'));
    }, 30000);

    const checkForNewImage = () => {
      const images = document.querySelectorAll(SELECTORS.resultImage);
      for (const img of images) {
        const src = (img as HTMLImageElement).src;
        if (src && !existingImages.has(src)) {
          clearTimeout(timeout);
          observer.disconnect();
          resolve(src);
          return true;
        }
      }
      return false;
    };

    // Check immediately
    if (checkForNewImage()) return;

    // Otherwise observe for changes
    const observer = new MutationObserver(() => {
      checkForNewImage();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });
  });

  return { imageUrl };
}

export async function generateOne(prompt: string): Promise<GenerationResult> {
  // Snapshot existing result images before generation so we can detect the new one
  const existingImages = new Set(
    Array.from(document.querySelectorAll(SELECTORS.resultImage))
      .map((img) => (img as HTMLImageElement).src)
  );

  await injectPrompt(prompt);
  await clickGenerate();
  return await waitForResult(existingImages);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
