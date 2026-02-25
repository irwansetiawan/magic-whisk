import { useEffect, useCallback } from 'react';
import type { AspectRatio } from '@/src/shared/types';
import { readAspectRatioFromPage, setAspectRatioOnPage } from '@/src/automation/driver';

/**
 * Bidirectional sync of aspect ratio between our panel and the Whisk page.
 *
 * - Panel → Page: calls setAspectRatioOnPage when user picks a ratio
 * - Page → Panel: observes the DOM for the aspect ratio popover appearing
 *   and reads the active button to update our state
 */
export function useAspectRatio(
  currentRatio: AspectRatio,
  onRatioChange: (ratio: AspectRatio) => void,
) {
  // Observe Whisk page for aspect ratio changes (user clicks ratio in Whisk UI)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const pageRatio = readAspectRatioFromPage();
      if (pageRatio && pageRatio !== currentRatio) {
        onRatioChange(pageRatio);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [currentRatio, onRatioChange]);

  // Set ratio on the Whisk page from our panel
  const setRatio = useCallback(async (ratio: AspectRatio) => {
    onRatioChange(ratio);
    await setAspectRatioOnPage(ratio);
  }, [onRatioChange]);

  return { setRatio };
}
