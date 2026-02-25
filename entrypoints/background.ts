import type { Message } from '@/src/shared/messages';

export default defineBackground(() => {
  console.log('Magic Whisk background service worker loaded');

  browser.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse) => {
      if (message.type === 'DOWNLOAD_IMAGE') {
        const { imageUrl, filename, folder } = message.payload;

        browser.downloads.download({
          url: imageUrl,
          filename: `${folder}/${filename}`,
          saveAs: false,
        }).then((downloadId) => {
          sendResponse({ success: true, downloadId });
        }).catch((error) => {
          console.error('Magic Whisk: download failed', error);
          sendResponse({ success: false, error: String(error) });
        });

        return true; // keep message channel open for async response
      }
    }
  );
});
