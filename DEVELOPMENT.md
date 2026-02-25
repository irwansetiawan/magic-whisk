# Development

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Dev Mode

```bash
npm run dev
```

This starts the WXT dev server with hot reload. WXT opens its own Chromium instance, but Google login may not work there. To test with your own Chrome:

1. Run `npm run build` instead
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** and select the `.output/chrome-mv3` folder
5. Navigate to https://labs.google/fx/tools/whisk

## Build

```bash
npm run build        # Production build -> .output/chrome-mv3
npm run zip          # Build + zip for Chrome Web Store upload
```

## DOM Selectors

The extension automates Whisk by interacting with its DOM. Selectors live in `src/automation/selectors.ts`. If Whisk's page structure changes, these need updating.

To find the correct selectors:

1. Open Whisk in Chrome
2. Right-click on the prompt input field -> Inspect
3. Note the selector for the textarea, generate button, loading indicator, and result images
4. Update `src/automation/selectors.ts` with the real selectors

## Tech Stack

- TypeScript, React 19, [WXT](https://wxt.dev/) (Vite-based extension framework)
- Chrome Extension Manifest V3
- Shadow DOM for style isolation via `createShadowRootUi`
