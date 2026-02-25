import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Magic Whisk',
    description: 'Batch image generation for Google Whisk — queue prompts, auto-download results, browse in a gallery.',
    permissions: ['storage', 'downloads'],
    host_permissions: ['*://labs.google/*', '*://*.googleusercontent.com/*'],
    web_accessible_resources: [
      {
        resources: ['icon/*'],
        matches: ['*://labs.google/*'],
      },
    ],
  },
});
