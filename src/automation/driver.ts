import { SELECTORS } from './selectors';
import { waitForElement, waitForElementRemoved } from './observer';

export interface GenerationResult {
  imageUrls: string[];
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
  const errorText = error?.textContent?.trim();
  if (error && errorText) {
    throw new Error(`Generation failed: ${errorText}`);
  }

  // Wait for at least one new image, then give a short settle time
  // for additional images to appear (Whisk often generates 2+ per prompt)
  await new Promise<void>((resolve, reject) => {
    let observer: MutationObserver | null = null;

    const cleanup = () => { observer?.disconnect(); };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout waiting for new generated image'));
    }, 30000);

    const hasNewImage = () => {
      const images = document.querySelectorAll(SELECTORS.resultImage);
      for (const img of images) {
        const src = (img as HTMLImageElement).src;
        if (src && !existingImages.has(src)) return true;
      }
      return false;
    };

    if (hasNewImage()) {
      clearTimeout(timeout);
      resolve();
      return;
    }

    observer = new MutationObserver(() => {
      if (hasNewImage()) {
        clearTimeout(timeout);
        cleanup();
        resolve();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src'],
    });
  });

  // Short delay to let all images from this generation render
  await delay(2000);

  // Collect ALL new images
  const imageUrls: string[] = [];
  const images = document.querySelectorAll(SELECTORS.resultImage);
  for (const img of images) {
    const src = (img as HTMLImageElement).src;
    if (src && !existingImages.has(src)) {
      imageUrls.push(src);
    }
  }

  if (imageUrls.length === 0) {
    throw new Error('No new images found after generation');
  }

  return { imageUrls };
}

export async function generateOne(prompt: string): Promise<GenerationResult> {
  // Snapshot existing result images before generation so we can detect the new one
  const existingImages = new Set(
    Array.from(document.querySelectorAll(SELECTORS.resultImage))
      .map((img) => (img as HTMLImageElement).src)
  );

  await injectPrompt(prompt);
  await clickGenerate();
  const result = await waitForResult(existingImages);

  // Convert blob URLs to data URLs so background can download them
  const convertedUrls = await Promise.all(
    result.imageUrls.map((url) =>
      url.startsWith('blob:') ? blobUrlToDataUrl(url) : Promise.resolve(url)
    )
  );

  return { imageUrls: convertedUrls };
}

/**
 * Convert a blob URL to a data URL so it can be sent to the background
 * service worker for downloading (blob URLs are page-scoped).
 */
async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
