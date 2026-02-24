import { generateOne, delay } from './driver';
import type { QueueItem, ResultItem } from '@/src/shared/types';

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

    // Delay between generations, but not after the last item
    if (!callbacks.shouldStop() && i < pending.length - 1) {
      const { delayBetweenGenerations } = callbacks.getSettings();
      await delay(delayBetweenGenerations);
    }
  }

  callbacks.onComplete();
}
