import { generateOne, setAspectRatioOnPage, delay } from './driver';
import type { QueueItem, ResultItem, AspectRatio } from '@/src/shared/types';

export interface RunnerCallbacks {
  onItemStart: (id: string) => void;
  onItemDone: (id: string, results: ResultItem[]) => void;
  onItemFailed: (id: string, error: string) => void;
  onComplete: () => void;
  getSettings: () => { delayBetweenGenerations: number; aspectRatio: AspectRatio };
  shouldPause: () => boolean;
  shouldStop: () => boolean;
}

export async function runQueue(
  items: QueueItem[],
  callbacks: RunnerCallbacks,
): Promise<void> {
  const pending = items.filter((item) => item.status === 'pending');

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    if (callbacks.shouldStop()) break;

    while (callbacks.shouldPause()) {
      await delay(500);
      if (callbacks.shouldStop()) break;
    }
    if (callbacks.shouldStop()) break;

    callbacks.onItemStart(item.id);

    try {
      // Set aspect ratio before each generation (user may change it mid-queue)
      const { aspectRatio } = callbacks.getSettings();
      await setAspectRatioOnPage(aspectRatio);

      const result = await generateOne(item.prompt);

      const resultItems: ResultItem[] = result.imageUrls.map((imageUrl) => ({
        id: crypto.randomUUID(),
        queueItemId: item.id,
        prompt: item.prompt,
        imageUrl,
        createdAt: Date.now(),
      }));

      callbacks.onItemDone(item.id, resultItems);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Magic Whisk] Item "${item.prompt.slice(0, 40)}" failed:`, err);
      callbacks.onItemFailed(item.id, message);
    }

    // Delay between generations, but not after the last item
    if (!callbacks.shouldStop() && i < pending.length - 1) {
      const { delayBetweenGenerations } = callbacks.getSettings();
      await delay(delayBetweenGenerations);
    }
  }

  callbacks.onComplete();
}
