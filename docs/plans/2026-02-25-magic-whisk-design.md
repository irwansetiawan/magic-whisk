# Magic Whisk — Chrome Extension Design

## Overview

Chrome extension that automates batch image generation on Google Whisk (https://labs.google/fx/tools/whisk/). Injects a slide-out panel directly into the Whisk page, drives the UI via DOM automation, and rides the user's existing auth session.

## MVP Scope (in priority order)

1. **Batch generation** — Queue multiple prompts, run them through Whisk automatically
2. **Auto-download** — Save generated images locally as they complete, with prompt-based filenames
3. **Results gallery** — View all generated images in-extension with selective download
4. **Prompt management** — (future) Save/reuse/template prompts, history, favorites

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Whisk Page (labs.google/fx/tools/whisk/)            │
│                                                      │
│  ┌────────────────────────────┐  ┌────────────────┐ │
│  │  Whisk's own UI            │  │ Magic Whisk    │ │
│  │                            │  │ Panel          │ │
│  │                            │  │ (Shadow DOM)   │ │
│  │                            │  │                │ │
│  │                            │  │ - Queue        │ │
│  │                            │  │ - Status       │ │
│  │                            │  │ - Gallery      │ │
│  └────────────────────────────┘  └────────────────┘ │
│                                    ▲  slide-out      │
│  Content Script ──────────────────┘                  │
│  (DOM automation + injected UI)                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Service Worker (background)                         │
│  - Download management (chrome.downloads API)        │
│  - chrome.storage persistence                        │
│  - State recovery on page refresh                    │
└──────────────────────────────────────────────────────┘
```

### Components

- **Content Script** — Injected into the Whisk tab. Does double duty: renders the panel UI (inside Shadow DOM for style isolation) and runs the DOM automation engine.
- **Service Worker** — Handles file downloads and storage persistence. Lean by design.
- **Storage** — `chrome.storage.local` for queue, results, and settings.

## Panel UI

Small branded icon fixed to the page edge. Click to slide out the full panel.

### Queue Tab

```
┌──────────────────────────────────┐
│  ✦ Magic Whisk              [×]  │
├──────────────────────────────────┤
│  [Queue] [Gallery] [⚙]           │
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────┐          │
│  │ prompt 1 (multi-   │  ✓      │
│  │ line ok)           │          │
│  └────────────────────┘          │
│  ┌────────────────────┐          │
│  │ prompt 2           │  ⟳      │
│  └────────────────────┘          │
│  ┌────────────────────┐          │
│  │ prompt 3 sits here │  ○      │
│  │ across two lines   │          │
│  └────────────────────┘          │
│                                  │
│  [+ Add Prompt]                  │
│                                  │
│  [▶ Start]  [⏸ Pause]           │
│                                  │
└──────────────────────────────────┘
```

- One auto-expanding textarea per prompt (supports multiline)
- Status indicator beside each: pending ○, running ⟳, done ✓, failed ✗
- Remove individual prompts with × on hover
- Start / Pause / Stop controls

### Gallery Tab

- Grid of thumbnail images with prompts underneath
- Click to view full size
- Select multiple + batch download
- Individual download icon per image

### Settings Tab

- Delay between generations (slider, default 5s)
- Auto-download toggle (default on)
- Download folder name (default "magic-whisk")

## DOM Automation Engine

### Generation Cycle

```
1. INJECT PROMPT  → Find text input, clear it, set new prompt
2. TRIGGER GENERATE → Click the generate button
3. WAIT FOR RESULT → MutationObserver watches for image to appear
4. EXTRACT IMAGE → Grab image URL from <img> src or background-image
5. SIGNAL DONE → Send to service worker for download + store in gallery
6. NEXT → Configurable delay, then next prompt in queue
```

### Key Patterns

- **MutationObserver** over polling — watch for DOM changes to detect generation completion
- **Centralized selectors** — All Whisk DOM selectors in `selectors.ts`. When Whisk updates their UI, only one file needs fixing.
- **Configurable delay** — Pause between generations to avoid rate limiting
- **Error handling** — Timeout or error message detection → mark as failed, skip to next

## Data Model

```typescript
interface QueueItem {
  id: string;
  prompt: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  error?: string;
  createdAt: number;
}

interface ResultItem {
  id: string;
  queueItemId: string;
  prompt: string;        // denormalized for easy display
  imageUrl: string;
  downloadPath?: string;
  createdAt: number;
}

interface Settings {
  delayBetweenGenerations: number;  // ms, default 5000
  autoDownload: boolean;            // default true
  downloadFolder: string;           // default "magic-whisk"
}
```

Storage keys: `queue`, `results`, `settings` in `chrome.storage.local`.

## Tech Stack

- **TypeScript** — Type safety for DOM selectors and message passing
- **React** — Panel UI components
- **Vite + CRXJS** — Fast builds, hot reload, manifest v3 bundling

## Project Structure

```
magic-whisk/
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── src/
│   ├── content/
│   │   ├── index.ts              # Entry: injects panel, sets up automation
│   │   ├── panel/
│   │   │   ├── Panel.tsx         # Root component (Shadow DOM host)
│   │   │   ├── QueueTab.tsx
│   │   │   ├── GalleryTab.tsx
│   │   │   ├── SettingsTab.tsx
│   │   │   └── panel.css
│   │   ├── automation/
│   │   │   ├── driver.ts         # Core automation loop
│   │   │   ├── selectors.ts      # All Whisk DOM selectors
│   │   │   └── observer.ts       # MutationObserver helpers
│   │   └── toggle.ts             # Icon button + slide-out behavior
│   │
│   ├── background/
│   │   └── service-worker.ts
│   │
│   ├── shared/
│   │   ├── types.ts
│   │   ├── storage.ts
│   │   └── messages.ts
│   │
│   └── assets/
│       └── icon.png
│
└── dist/
```

## Dev Workflow

```bash
npm run dev     # Vite dev server + CRXJS hot reload → dist/
npm run build   # Production build → dist/
```

Load `dist/` as unpacked extension in `chrome://extensions` once. CRXJS handles reloads after that.
