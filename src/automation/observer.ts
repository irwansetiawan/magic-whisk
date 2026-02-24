// src/automation/observer.ts

export function waitForElement(
  selector: string,
  options: { timeout?: number; parent?: Element } = {},
): Promise<Element> {
  const { timeout = 60000, parent = document } = options;

  return new Promise((resolve, reject) => {
    const existing = parent.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);

    const observer = new MutationObserver(() => {
      const el = parent.querySelector(selector);
      if (el) {
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(parent as Node, {
      childList: true,
      subtree: true,
    });
  });
}

export function waitForElementRemoved(
  selector: string,
  options: { timeout?: number; parent?: Element } = {},
): Promise<void> {
  const { timeout = 120000, parent = document } = options;

  return new Promise((resolve, reject) => {
    if (!parent.querySelector(selector)) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element removal: ${selector}`));
    }, timeout);

    const observer = new MutationObserver(() => {
      if (!parent.querySelector(selector)) {
        clearTimeout(timeoutId);
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(parent as Node, {
      childList: true,
      subtree: true,
    });
  });
}
