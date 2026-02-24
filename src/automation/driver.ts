// src/automation/driver.ts
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

async function waitForResult(): Promise<GenerationResult> {
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

  const img = await waitForElement(SELECTORS.resultImage, { timeout: 10000 });
  const imageUrl = (img as HTMLImageElement).src;

  if (!imageUrl) {
    throw new Error('Generated image has no src');
  }

  return { imageUrl };
}

export async function generateOne(prompt: string): Promise<GenerationResult> {
  await injectPrompt(prompt);
  await clickGenerate();
  return await waitForResult();
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
