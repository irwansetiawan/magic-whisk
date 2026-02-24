# Magic Whisk

Chrome extension that automates batch image generation on [Google Whisk](https://labs.google/fx/tools/whisk/). Injects a slide-out panel directly into the Whisk page for queuing prompts, auto-downloading results, and managing a gallery of generated images.

## Features

- **Batch generation** -- Queue multiple prompts and run them through Whisk automatically
- **Auto-download** -- Images save to your downloads folder as they're generated
- **Results gallery** -- Browse all generated images, select and batch download
- **Settings** -- Configure delay between generations, toggle auto-download, set download folder name

## Install (Development)

```bash
npm install
npm run dev
```

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `.output/chrome-mv3` folder
4. Navigate to https://labs.google/fx/tools/whisk

A small blue toggle button will appear on the right edge of the page. Click it to open the Magic Whisk panel.

## Usage

1. Open the panel and add prompts (one textarea per prompt, multiline supported)
2. Click **Start** to begin batch generation
3. Use **Pause/Resume** or **Stop** to control the queue
4. Switch to the **Gallery** tab to browse results
5. Adjust settings in the **Settings** tab (gear icon)

## Important: DOM Selectors

The extension automates Whisk by interacting with its DOM. The selectors in `src/automation/selectors.ts` are **placeholders** and must be updated to match Whisk's actual page structure.

To find the correct selectors:

1. Open Whisk in Chrome
2. Right-click on the prompt input field -> Inspect
3. Note the selector for the textarea, generate button, loading indicator, and result images
4. Update `src/automation/selectors.ts` with the real selectors

## Build

```bash
npm run build    # Production build -> .output/chrome-mv3
```

## Tech Stack

- TypeScript, React, [WXT](https://wxt.dev/) (Vite-based extension framework)
- Chrome Extension Manifest V3
- Shadow DOM for style isolation
