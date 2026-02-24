# Magic Whisk Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Chrome extension that injects a slide-out panel into Google Whisk for batch image generation with auto-download and a results gallery.

**Architecture:** Content script injected into Whisk page renders a React UI inside Shadow DOM (slide-out drawer). DOM automation engine drives Whisk's UI to process a prompt queue. Service worker handles downloads via `chrome.downloads` API.

**Tech Stack:** TypeScript, React, WXT (Vite-based extension framework), `chrome.storage.local`, `chrome.downloads`

**Note:** We switched from CRXJS to [WXT](https://wxt.dev/) — it has built-in `createShadowRootUi` for Shadow DOM content script UIs, is actively maintained, and handles manifest v3 out of the box.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `wxt.config.ts`
- Create: `entrypoints/background.ts`
- Create: `entrypoints/magic-whisk.content/index.tsx`

**Step 1: Initialize WXT project with React template**

Run:
```bash
cd /Users/irwansetiawan/Projects/fusionone/magic-whisk
npx wxt@latest init . --template react
```

If the `init` command doesn't support `.` as target, initialize in a temp dir and move files.

Expected: Project scaffolded with `package.json`, `wxt.config.ts`, `tsconfig.json`, `entrypoints/` directory.

**Step 2: Install dependencies**

Run:
```bash
npm install
```

Expected: `node_modules/` created, no errors.

**Step 3: Clean up default entrypoints, configure for Whisk**

Remove any default popup/entrypoints that were scaffolded. Create the content script entrypoint directory:

- Delete: any default `entrypoints/popup*` files (we don't use a popup)
- Keep: `entrypoints/background.ts` (we'll use it later for downloads)
- Create: `entrypoints/magic-whisk.content/index.tsx` with a minimal content script:

```typescript
import ReactDOM from 'react-dom/client';

export default defineContentScript({
  matches: ['*://labs.google/fx/tools/whisk*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'magic-whisk',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = ReactDOM.createRoot(app);
        root.render(<div>Magic Whisk loaded</div>);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
```

Update `entrypoints/background.ts`:

```typescript
export default defineBackground(() => {
  console.log('Magic Whisk background service worker loaded');
});
```

**Step 4: Verify it builds and loads**

Run:
```bash
npm run dev
```

Expected: Builds successfully. Load the extension in Chrome (`chrome://extensions` → Load unpacked → select `.output/chrome-mv3`). Navigate to https://labs.google/fx/tools/whisk — "Magic Whisk loaded" text should appear on the page.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold WXT project with content script targeting Whisk"
```

---

### Task 2: Shared Types & Storage Layer

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/storage.ts`
- Create: `src/shared/messages.ts`

**Step 1: Create shared types**

```typescript
// src/shared/types.ts

export interface QueueItem {
  id: string;
  prompt: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  error?: string;
  createdAt: number;
}

export interface ResultItem {
  id: string;
  queueItemId: string;
  prompt: string;
  imageUrl: string;
  downloadPath?: string;
  createdAt: number;
}

export interface Settings {
  delayBetweenGenerations: number;
  autoDownload: boolean;
  downloadFolder: string;
}

export const DEFAULT_SETTINGS: Settings = {
  delayBetweenGenerations: 5000,
  autoDownload: true,
  downloadFolder: 'magic-whisk',
};
```

**Step 2: Create storage helpers**

Use WXT's built-in `storage` API (it wraps `chrome.storage` with reactive helpers):

```typescript
// src/shared/storage.ts
import { storage } from 'wxt/storage';
import type { QueueItem, ResultItem, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

export const queueStorage = storage.defineItem<QueueItem[]>('local:queue', {
  fallback: [],
});

export const resultsStorage = storage.defineItem<ResultItem[]>('local:results', {
  fallback: [],
});

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});
```

**Step 3: Create message types for content ↔ background communication**

```typescript
// src/shared/messages.ts
import type { ResultItem } from './types';

export interface DownloadImageMessage {
  type: 'DOWNLOAD_IMAGE';
  payload: {
    imageUrl: string;
    filename: string;
    folder: string;
  };
}

export interface DownloadCompleteMessage {
  type: 'DOWNLOAD_COMPLETE';
  payload: {
    resultId: string;
    downloadPath: string;
  };
}

export type Message = DownloadImageMessage | DownloadCompleteMessage;
```

**Step 4: Verify it compiles**

Run:
```bash
npm run build
```

Expected: Builds with no TypeScript errors.

**Step 5: Commit**

```bash
git add src/shared/
git commit -m "feat: add shared types, storage layer, and message definitions"
```

---

### Task 3: Toggle Button & Panel Shell

**Files:**
- Create: `entrypoints/magic-whisk.content/App.tsx`
- Create: `entrypoints/magic-whisk.content/components/ToggleButton.tsx`
- Create: `entrypoints/magic-whisk.content/components/Panel.tsx`
- Create: `entrypoints/magic-whisk.content/style.css`
- Modify: `entrypoints/magic-whisk.content/index.tsx`

**Step 1: Create the root App component with toggle state**

```tsx
// entrypoints/magic-whisk.content/App.tsx
import { useState } from 'react';
import { ToggleButton } from './components/ToggleButton';
import { Panel } from './components/Panel';

export function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ToggleButton onClick={() => setIsOpen(!isOpen)} isOpen={isOpen} />
      {isOpen && <Panel onClose={() => setIsOpen(false)} />}
    </>
  );
}
```

**Step 2: Create the toggle button**

A small fixed button on the right edge of the viewport.

```tsx
// entrypoints/magic-whisk.content/components/ToggleButton.tsx
interface ToggleButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function ToggleButton({ onClick, isOpen }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        right: isOpen ? '340px' : '0',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10000,
        width: '32px',
        height: '64px',
        border: 'none',
        borderRadius: '8px 0 0 8px',
        background: '#1a73e8',
        color: 'white',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'right 0.3s ease',
      }}
      title="Magic Whisk"
    >
      {isOpen ? '›' : '‹'}
    </button>
  );
}
```

**Step 3: Create the panel shell with tab navigation**

```tsx
// entrypoints/magic-whisk.content/components/Panel.tsx
import { useState } from 'react';

type Tab = 'queue' | 'gallery' | 'settings';

interface PanelProps {
  onClose: () => void;
}

export function Panel({ onClose }: PanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('queue');

  return (
    <div
      style={{
        position: 'fixed',
        right: '0',
        top: '0',
        width: '340px',
        height: '100vh',
        background: '#1e1e1e',
        color: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #333',
      }}>
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Magic Whisk</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '18px',
          }}
        >×</button>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #333',
      }}>
        {(['queue', 'gallery', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === tab ? '#2a2a2a' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #1a73e8' : '2px solid transparent',
              color: activeTab === tab ? '#fff' : '#888',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'settings' ? '⚙' : tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {activeTab === 'queue' && <div>Queue tab (coming next)</div>}
        {activeTab === 'gallery' && <div>Gallery tab (coming later)</div>}
        {activeTab === 'settings' && <div>Settings tab (coming later)</div>}
      </div>
    </div>
  );
}
```

**Step 4: Wire App into the content script entry point**

Update `entrypoints/magic-whisk.content/index.tsx`:

```tsx
import './style.css';
import ReactDOM from 'react-dom/client';
import { App } from './App';

export default defineContentScript({
  matches: ['*://labs.google/fx/tools/whisk*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'magic-whisk',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        const app = document.createElement('div');
        container.append(app);
        const root = ReactDOM.createRoot(app);
        root.render(<App />);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
```

Add minimal base styles in `entrypoints/magic-whisk.content/style.css`:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
```

**Step 5: Test visually**

Run `npm run dev`, navigate to Whisk. Verify:
- Small blue toggle button appears on the right edge
- Clicking it slides open the panel
- Panel has header, tab bar (Queue/Gallery/⚙), and placeholder content
- Clicking × closes the panel
- Toggle button moves with the panel

**Step 6: Commit**

```bash
git add entrypoints/
git commit -m "feat: add toggle button and slide-out panel shell with tab navigation"
```

---

### Task 4: Queue Tab UI

**Files:**
- Create: `entrypoints/magic-whisk.content/components/QueueTab.tsx`
- Create: `entrypoints/magic-whisk.content/components/PromptInput.tsx`
- Create: `entrypoints/magic-whisk.content/hooks/useQueue.ts`
- Modify: `entrypoints/magic-whisk.content/components/Panel.tsx`

**Step 1: Create useQueue hook for queue state management**

```typescript
// entrypoints/magic-whisk.content/hooks/useQueue.ts
import { useState, useCallback } from 'react';
import type { QueueItem } from '@/shared/types';

export function useQueue() {
  const [items, setItems] = useState<QueueItem[]>([
    createItem(''),
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createItem('')]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updatePrompt = useCallback((id: string, prompt: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, prompt } : item))
    );
  }, []);

  const updateStatus = useCallback((id: string, status: QueueItem['status'], error?: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, error } : item))
    );
  }, []);

  return {
    items,
    setItems,
    isRunning,
    setIsRunning,
    isPaused,
    setIsPaused,
    addItem,
    removeItem,
    updatePrompt,
    updateStatus,
  };
}

function createItem(prompt: string): QueueItem {
  return {
    id: crypto.randomUUID(),
    prompt,
    status: 'pending',
    createdAt: Date.now(),
  };
}
```

**Step 2: Create PromptInput component**

An auto-expanding textarea with status indicator and remove button.

```tsx
// entrypoints/magic-whisk.content/components/PromptInput.tsx
import { useRef, useEffect } from 'react';
import type { QueueItem } from '@/shared/types';

const STATUS_ICONS: Record<QueueItem['status'], string> = {
  pending: '○',
  running: '⟳',
  done: '✓',
  failed: '✗',
};

const STATUS_COLORS: Record<QueueItem['status'], string> = {
  pending: '#888',
  running: '#1a73e8',
  done: '#34a853',
  failed: '#ea4335',
};

interface PromptInputProps {
  item: QueueItem;
  onChangePrompt: (prompt: string) => void;
  onRemove: () => void;
  disabled: boolean;
}

export function PromptInput({ item, onChangePrompt, onRemove, disabled }: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [item.prompt]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      marginBottom: '8px',
    }}>
      <textarea
        ref={textareaRef}
        value={item.prompt}
        onChange={(e) => onChangePrompt(e.target.value)}
        disabled={disabled}
        placeholder="Enter prompt..."
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          overflow: 'hidden',
          background: '#2a2a2a',
          border: '1px solid #444',
          borderRadius: '6px',
          color: '#e0e0e0',
          padding: '8px',
          fontSize: '13px',
          fontFamily: 'inherit',
          lineHeight: '1.4',
        }}
      />
      <span
        style={{
          color: STATUS_COLORS[item.status],
          fontSize: '16px',
          lineHeight: '36px',
          minWidth: '20px',
          textAlign: 'center',
        }}
        title={item.status}
      >
        {STATUS_ICONS[item.status]}
      </span>
      {!disabled && (
        <button
          onClick={onRemove}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: '36px',
          }}
          title="Remove prompt"
        >×</button>
      )}
    </div>
  );
}
```

**Step 3: Create QueueTab component**

```tsx
// entrypoints/magic-whisk.content/components/QueueTab.tsx
import type { QueueItem } from '@/shared/types';
import { PromptInput } from './PromptInput';

interface QueueTabProps {
  items: QueueItem[];
  isRunning: boolean;
  isPaused: boolean;
  onAddItem: () => void;
  onRemoveItem: (id: string) => void;
  onUpdatePrompt: (id: string, prompt: string) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function QueueTab({
  items,
  isRunning,
  isPaused,
  onAddItem,
  onRemoveItem,
  onUpdatePrompt,
  onStart,
  onPause,
  onStop,
}: QueueTabProps) {
  const hasPrompts = items.some((item) => item.prompt.trim() !== '');

  return (
    <div>
      {items.map((item) => (
        <PromptInput
          key={item.id}
          item={item}
          onChangePrompt={(prompt) => onUpdatePrompt(item.id, prompt)}
          onRemove={() => onRemoveItem(item.id)}
          disabled={isRunning && item.status !== 'pending'}
        />
      ))}

      {!isRunning && (
        <button
          onClick={onAddItem}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px dashed #444',
            borderRadius: '6px',
            color: '#888',
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          + Add Prompt
        </button>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        {!isRunning && (
          <button
            onClick={onStart}
            disabled={!hasPrompts}
            style={{
              flex: 1,
              padding: '10px',
              background: hasPrompts ? '#1a73e8' : '#333',
              color: hasPrompts ? '#fff' : '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: hasPrompts ? 'pointer' : 'default',
              fontWeight: 'bold',
            }}
          >
            ▶ Start
          </button>
        )}
        {isRunning && (
          <>
            <button
              onClick={onPause}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f9ab00',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              onClick={onStop}
              style={{
                flex: 1,
                padding: '10px',
                background: '#ea4335',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ■ Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Wire QueueTab into Panel**

Update `Panel.tsx` to import and render `QueueTab` with the `useQueue` hook, replacing the placeholder.

**Step 5: Test visually**

Run `npm run dev`, navigate to Whisk. Verify:
- Queue tab shows one empty textarea by default
- Can add multiple prompts, each with its own textarea
- Textareas auto-expand on multiline input
- × removes individual prompts
- Start button is disabled when all prompts are empty
- Start button is enabled when at least one prompt has text

**Step 6: Commit**

```bash
git add entrypoints/ src/
git commit -m "feat: add queue tab with prompt inputs and control buttons"
```

---

### Task 5: DOM Automation — Selectors & Observer

**Files:**
- Create: `src/automation/selectors.ts`
- Create: `src/automation/observer.ts`

**Step 1: Create selectors module**

This file centralizes all Whisk DOM selectors. These selectors will need to be discovered by inspecting Whisk's actual DOM — use placeholder selectors that we'll update after inspecting the live page.

```typescript
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
```

**Step 2: Create MutationObserver helper**

```typescript
// src/automation/observer.ts

/**
 * Wait for an element matching the selector to appear in the DOM.
 * Returns the element when found, or rejects after timeout.
 */
export function waitForElement(
  selector: string,
  options: { timeout?: number; parent?: Element } = {}
): Promise<Element> {
  const { timeout = 60000, parent = document } = options;

  return new Promise((resolve, reject) => {
    // Check if already present
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

/**
 * Wait for an element to disappear from the DOM.
 */
export function waitForElementRemoved(
  selector: string,
  options: { timeout?: number; parent?: Element } = {}
): Promise<void> {
  const { timeout = 120000, parent = document } = options;

  return new Promise((resolve, reject) => {
    // Check if already gone
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
```

**Step 3: Verify it compiles**

Run: `npm run build`

Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add src/automation/
git commit -m "feat: add DOM selectors module and MutationObserver helpers"
```

---

### Task 6: DOM Automation — Driver

**Files:**
- Create: `src/automation/driver.ts`

**Step 1: Create the automation driver**

The driver processes one prompt at a time through the generate cycle.

```typescript
// src/automation/driver.ts
import { SELECTORS } from './selectors';
import { waitForElement, waitForElementRemoved } from './observer';

export interface GenerationResult {
  imageUrl: string;
}

/**
 * Set the prompt text in Whisk's input field.
 */
async function injectPrompt(prompt: string): Promise<void> {
  const input = await waitForElement(SELECTORS.promptInput, { timeout: 10000 });
  const el = input as HTMLTextAreaElement;

  // Clear existing text
  el.focus();
  el.value = '';
  el.dispatchEvent(new Event('input', { bubbles: true }));

  // Set new prompt
  el.value = prompt;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Click the generate button.
 */
async function clickGenerate(): Promise<void> {
  const button = await waitForElement(SELECTORS.generateButton, { timeout: 10000 });
  (button as HTMLButtonElement).click();
}

/**
 * Wait for the generation to complete and extract the image URL.
 */
async function waitForResult(): Promise<GenerationResult> {
  // Wait for loading to start (optional — it might already be loading)
  try {
    await waitForElement(SELECTORS.loadingIndicator, { timeout: 5000 });
  } catch {
    // Loading may have already started and finished, continue
  }

  // Wait for loading to finish
  await waitForElementRemoved(SELECTORS.loadingIndicator, { timeout: 120000 });

  // Check for error
  const error = document.querySelector(SELECTORS.errorMessage);
  if (error) {
    throw new Error(`Generation failed: ${error.textContent?.trim() || 'Unknown error'}`);
  }

  // Extract the result image
  const img = await waitForElement(SELECTORS.resultImage, { timeout: 10000 });
  const imageUrl = (img as HTMLImageElement).src;

  if (!imageUrl) {
    throw new Error('Generated image has no src');
  }

  return { imageUrl };
}

/**
 * Run a single prompt through the full generation cycle.
 */
export async function generateOne(prompt: string): Promise<GenerationResult> {
  await injectPrompt(prompt);
  await clickGenerate();
  return await waitForResult();
}

/**
 * Delay helper.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**Step 2: Verify it compiles**

Run: `npm run build`

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add src/automation/driver.ts
git commit -m "feat: add automation driver with generate cycle"
```

---

### Task 7: Batch Queue Runner

**Files:**
- Create: `src/automation/runner.ts`

**Step 1: Create the batch runner**

This orchestrates running through the full queue, handling pause/stop/errors.

```typescript
// src/automation/runner.ts
import { generateOne, delay } from './driver';
import type { QueueItem, ResultItem } from '@/shared/types';

export interface RunnerCallbacks {
  onItemStart: (id: string) => void;
  onItemDone: (id: string, result: ResultItem) => void;
  onItemFailed: (id: string, error: string) => void;
  onComplete: () => void;
  getSettings: () => { delayBetweenGenerations: number };
  shouldPause: () => boolean;
  shouldStop: () => boolean;
}

export async function runQueue(
  items: QueueItem[],
  callbacks: RunnerCallbacks,
): Promise<void> {
  const pending = items.filter((item) => item.status === 'pending');

  for (const item of pending) {
    if (callbacks.shouldStop()) break;

    // Wait while paused
    while (callbacks.shouldPause()) {
      await delay(500);
      if (callbacks.shouldStop()) break;
    }
    if (callbacks.shouldStop()) break;

    callbacks.onItemStart(item.id);

    try {
      const result = await generateOne(item.prompt);

      const resultItem: ResultItem = {
        id: crypto.randomUUID(),
        queueItemId: item.id,
        prompt: item.prompt,
        imageUrl: result.imageUrl,
        createdAt: Date.now(),
      };

      callbacks.onItemDone(item.id, resultItem);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      callbacks.onItemFailed(item.id, message);
    }

    // Delay between generations (unless it was the last one)
    if (!callbacks.shouldStop()) {
      const { delayBetweenGenerations } = callbacks.getSettings();
      await delay(delayBetweenGenerations);
    }
  }

  callbacks.onComplete();
}
```

**Step 2: Verify it compiles**

Run: `npm run build`

Expected: No TypeScript errors.

**Step 3: Commit**

```bash
git add src/automation/runner.ts
git commit -m "feat: add batch queue runner with pause/stop support"
```

---

### Task 8: Wire Queue Runner to UI

**Files:**
- Modify: `entrypoints/magic-whisk.content/hooks/useQueue.ts`
- Modify: `entrypoints/magic-whisk.content/App.tsx`
- Modify: `entrypoints/magic-whisk.content/components/Panel.tsx`

**Step 1: Add runner integration to useQueue hook**

Add `start`, `pause`, and `stop` functions that call the runner with callbacks wired to React state. Store results in a `results` state array.

**Step 2: Pass results state down to Panel for gallery tab use**

**Step 3: Wire the `onStart`, `onPause`, `onStop` handlers from the hook into the QueueTab buttons**

**Step 4: Test end-to-end manually**

Run `npm run dev`, navigate to Whisk. Add a prompt, click Start. The automation should:
1. Inject the prompt into Whisk's input
2. Click generate
3. Wait for result
4. Mark the queue item as done
5. Move to the next prompt

**Note:** This step will likely require updating `src/automation/selectors.ts` with the real DOM selectors from Whisk's page. Inspect Whisk's DOM to find the correct selectors.

**Step 5: Commit**

```bash
git add entrypoints/ src/
git commit -m "feat: wire queue runner to UI with start/pause/stop controls"
```

---

### Task 9: Background Service Worker — Download Management

**Files:**
- Modify: `entrypoints/background.ts`
- Modify: `src/automation/runner.ts` (or `useQueue.ts`)

**Step 1: Add download message handler to service worker**

```typescript
// entrypoints/background.ts
import type { Message } from '@/shared/messages';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse) => {
      if (message.type === 'DOWNLOAD_IMAGE') {
        const { imageUrl, filename, folder } = message.payload;

        chrome.downloads.download({
          url: imageUrl,
          filename: `${folder}/${filename}`,
          saveAs: false,
        }, (downloadId) => {
          sendResponse({ success: true, downloadId });
        });

        return true; // keep message channel open for async response
      }
    }
  );
});
```

**Step 2: Send download message from content script when a result is generated**

In the `onItemDone` callback, if `autoDownload` is enabled, send a message to the background:

```typescript
browser.runtime.sendMessage({
  type: 'DOWNLOAD_IMAGE',
  payload: {
    imageUrl: result.imageUrl,
    filename: `${sanitize(item.prompt)}-${Date.now()}.png`,
    folder: settings.downloadFolder,
  },
});
```

**Step 3: Add `downloads` permission to WXT config**

In `wxt.config.ts`, add the permission:

```typescript
export default defineConfig({
  manifest: {
    permissions: ['storage', 'downloads'],
  },
});
```

**Step 4: Test download flow**

Run a batch, verify images are auto-downloaded to the `magic-whisk/` subfolder in the default Chrome downloads directory.

**Step 5: Commit**

```bash
git add entrypoints/ src/ wxt.config.ts
git commit -m "feat: add auto-download via background service worker"
```

---

### Task 10: Gallery Tab

**Files:**
- Create: `entrypoints/magic-whisk.content/components/GalleryTab.tsx`
- Modify: `entrypoints/magic-whisk.content/components/Panel.tsx`

**Step 1: Create GalleryTab component**

```tsx
// entrypoints/magic-whisk.content/components/GalleryTab.tsx
import { useState } from 'react';
import type { ResultItem } from '@/shared/types';

interface GalleryTabProps {
  results: ResultItem[];
}

export function GalleryTab({ results }: GalleryTabProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadSelected = () => {
    selected.forEach((id) => {
      const item = results.find((r) => r.id === id);
      if (item) {
        browser.runtime.sendMessage({
          type: 'DOWNLOAD_IMAGE',
          payload: {
            imageUrl: item.imageUrl,
            filename: `${item.prompt.slice(0, 50).replace(/[^a-z0-9]/gi, '_')}-${item.id.slice(0, 8)}.png`,
            folder: 'magic-whisk',
          },
        });
      }
    });
  };

  if (results.length === 0) {
    return <div style={{ color: '#888', textAlign: 'center', padding: '32px 0' }}>No results yet. Run some prompts first.</div>;
  }

  return (
    <div>
      {selected.size > 0 && (
        <button
          onClick={downloadSelected}
          style={{
            width: '100%',
            padding: '8px',
            background: '#1a73e8',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          Download {selected.size} selected
        </button>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        {results.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleSelect(item.id)}
            style={{
              border: selected.has(item.id) ? '2px solid #1a73e8' : '2px solid transparent',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#2a2a2a',
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.prompt}
              style={{ width: '100%', display: 'block', aspectRatio: '1' , objectFit: 'cover' }}
            />
            <div style={{
              padding: '6px',
              fontSize: '11px',
              color: '#aaa',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.prompt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Wire GalleryTab into Panel**

Pass `results` from the queue hook to the GalleryTab component.

**Step 3: Test visually**

After running a batch, switch to Gallery tab. Verify:
- Results display as a 2-column grid
- Clicking an image selects it (blue border)
- "Download selected" button appears when items are selected
- Empty state message shows when no results

**Step 4: Commit**

```bash
git add entrypoints/
git commit -m "feat: add gallery tab with image grid and batch download"
```

---

### Task 11: Settings Tab

**Files:**
- Create: `entrypoints/magic-whisk.content/components/SettingsTab.tsx`
- Modify: `entrypoints/magic-whisk.content/components/Panel.tsx`
- Modify: `entrypoints/magic-whisk.content/hooks/useQueue.ts`

**Step 1: Create SettingsTab component**

A simple form with:
- Slider for delay between generations (1s–15s)
- Toggle for auto-download
- Text input for download folder name

**Step 2: Load/save settings using `settingsStorage` from `src/shared/storage.ts`**

Create a `useSettings` hook that reads from and writes to `chrome.storage.local` via the WXT storage helpers.

**Step 3: Wire settings into the runner**

The `getSettings` callback in the runner should read from the settings state.

**Step 4: Test**

Change delay to 10s, run a 2-prompt batch, verify the delay between generations is ~10s.

**Step 5: Commit**

```bash
git add entrypoints/ src/
git commit -m "feat: add settings tab with delay, auto-download, and folder config"
```

---

### Task 12: Selector Discovery & Polish

**Files:**
- Modify: `src/automation/selectors.ts`

**Step 1: Inspect Whisk's live DOM**

Open https://labs.google/fx/tools/whisk in Chrome DevTools. Identify the actual selectors for:
- Prompt text input
- Generate/Create button
- Loading indicator
- Result image(s)
- Error messages

**Step 2: Update selectors.ts with real selectors**

Replace all placeholder selectors with the real ones found in Step 1.

**Step 3: Test full end-to-end flow**

1. Open Whisk
2. Open Magic Whisk panel
3. Enter 3 different prompts
4. Click Start
5. Verify each prompt is processed in sequence
6. Verify images auto-download
7. Verify gallery shows all results
8. Test pause/resume mid-batch
9. Test stop mid-batch

**Step 4: Fix any issues found during testing**

**Step 5: Commit**

```bash
git add src/automation/selectors.ts
git commit -m "feat: update DOM selectors to match Whisk's live page structure"
```

---

### Task 13: Final Cleanup & README

**Files:**
- Create: `README.md`
- Modify: `wxt.config.ts` (ensure all permissions are correct)

**Step 1: Write README**

Include: what the extension does, how to install (dev mode), how to use, known limitations.

**Step 2: Verify all permissions in manifest**

Ensure `wxt.config.ts` has:
- `permissions: ['storage', 'downloads']`
- `host_permissions: ['*://labs.google/*']` (if needed for downloads)

**Step 3: Run production build**

```bash
npm run build
```

Verify the output in `.output/chrome-mv3` is clean and loadable.

**Step 4: Commit & push**

```bash
git add -A
git commit -m "docs: add README and finalize extension config"
git push
```
