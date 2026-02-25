# Magic Whisk

## What This Is

Chrome extension that automates batch image generation on Google Whisk (https://labs.google/fx/tools/whisk/). It injects a slide-out panel directly into the Whisk page, letting users queue multiple prompts and run them through Whisk automatically with auto-download.

Whisk is Google's AI image generation tool (Imagen 4). It has no public API, so the extension drives the browser UI via DOM automation, riding the user's existing auth cookies.

## Architecture

```
Whisk Page (labs.google/fx/tools/whisk/)
├── Content Script (entrypoints/magic-whisk.content/)
│   ├── Injected Panel UI (React, rendered in Shadow DOM)
│   │   ├── Queue Tab — prompt inputs, start/pause/stop
│   │   ├── Gallery Tab — result image grid, batch download
│   │   └── Settings Tab — delay, auto-download, folder name
│   └── DOM Automation Engine (src/automation/)
│       ├── selectors.ts — all Whisk DOM selectors (single file to update when Whisk changes)
│       ├── observer.ts — MutationObserver helpers (waitForElement, waitForElementRemoved)
│       ├── driver.ts — single-prompt generation cycle (inject, click, wait, extract)
│       └── runner.ts — batch queue processor with pause/stop/callbacks
│
└── Background Service Worker (entrypoints/background.ts)
    └── Download management via browser.downloads API
```

The content script does double duty: it renders the panel UI and runs the automation. The background service worker is lean — it only handles file downloads (because `browser.downloads` requires the background context).

## Key Design Decisions

- **Shadow DOM** for the panel UI — isolates our styles from Whisk's CSS and vice versa. WXT's `createShadowRootUi` handles this.
- **Centralized selectors** — all Whisk DOM selectors live in `src/automation/selectors.ts`. When Whisk updates their UI, only this file needs changing.
- **Blob-to-data-URL conversion** — Whisk serves generated images as blob URLs (page-scoped). The content script converts them to data URLs before sending to the background for download.
- **Ref-based state bridge** — React state (isPaused, isStopped, settings) is mirrored to `useRef` so the async runner loop always reads the latest values without stale closures.

## Project Structure

```
magic-whisk/
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── wxt.config.ts                          # WXT config, manifest permissions
│
├── entrypoints/
│   ├── background.ts                      # Service worker: download handler
│   └── magic-whisk.content/               # Content script (injected into Whisk)
│       ├── index.tsx                      # Entry: Shadow DOM setup, mounts React
│       ├── App.tsx                        # Root: toggle button + panel
│       ├── style.css                      # Base reset (scoped to Shadow DOM)
│       ├── components/
│       │   ├── ToggleButton.tsx           # Small icon on page edge
│       │   ├── Panel.tsx                  # Slide-out panel with tab bar
│       │   ├── QueueTab.tsx               # Prompt list + controls
│       │   ├── PromptInput.tsx            # Single auto-expanding textarea
│       │   ├── GalleryTab.tsx             # Result image grid
│       │   └── SettingsTab.tsx            # Delay, auto-download, folder
│       └── hooks/
│           ├── useQueue.ts                # Queue state + runner integration
│           └── useSettings.ts             # Settings with chrome.storage persistence
│
├── src/
│   ├── automation/
│   │   ├── selectors.ts                   # Whisk DOM selectors (UPDATE THIS when Whisk changes)
│   │   ├── observer.ts                    # MutationObserver helpers
│   │   ├── driver.ts                      # Single-prompt generation cycle
│   │   └── runner.ts                      # Batch queue processor
│   └── shared/
│       ├── types.ts                       # QueueItem, ResultItem, Settings interfaces
│       ├── storage.ts                     # WXT storage items (chrome.storage.local)
│       └── messages.ts                    # Message types for content <-> background
│
├── docs/plans/                            # Design doc and implementation plan
└── .output/chrome-mv3/                    # Build output (load as unpacked extension)
```

## Tech Stack

- **TypeScript** + **React** for the panel UI
- **WXT** (https://wxt.dev/) — Vite-based Chrome extension framework, handles manifest v3, hot reload, Shadow DOM content scripts
- **chrome.storage.local** for settings persistence (via WXT's `storage.defineItem`)
- **browser.downloads** for auto-downloading generated images

## Development

```bash
npm install
npm run build          # Production build -> .output/chrome-mv3/
```

Load `.output/chrome-mv3/` as an unpacked extension in `chrome://extensions` (developer mode).

WXT's `npm run dev` opens its own Chromium — but since Whisk requires Google login, it's easier to build and load into your own Chrome.

## Important: DOM Selectors

The extension breaks if Whisk changes their DOM. All selectors are in `src/automation/selectors.ts`. To fix after a Whisk update:

1. Open Whisk, right-click elements, Inspect
2. Update the selectors in `selectors.ts`
3. Rebuild

## Data Flow

1. User enters prompts in Queue tab
2. Clicks Start -> `useQueue.start()` calls `runQueue()`
3. For each prompt: `driver.generateOne()` injects prompt, clicks generate, waits for result via MutationObserver
4. Result blob URL is converted to data URL in content script
5. `onItemDone` callback updates React state and sends `DOWNLOAD_IMAGE` message to background
6. Background service worker downloads the image via `browser.downloads.download()`
