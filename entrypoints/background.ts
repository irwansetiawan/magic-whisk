import type { Message } from '@/src/shared/messages';

export default defineBackground(() => {
  console.log('Magic Whisk background service worker loaded');

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
