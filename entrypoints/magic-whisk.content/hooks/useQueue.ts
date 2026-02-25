import { useState, useCallback, useRef } from 'react';
import type { QueueItem, ResultItem, Settings } from '@/src/shared/types';
import { runQueue } from '@/src/automation/runner';

export function useQueue(settings: Settings) {
  const [items, setItems] = useState<QueueItem[]>([
    createItem(''),
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  const isPausedRef = useRef(false);
  const isStoppedRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createItem('')]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updatePrompt = useCallback((id: string, prompt: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, prompt } : item))
    );
  }, []);

  const updateStatus = useCallback((id: string, status: QueueItem['status'], error?: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, error } : item))
    );
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isStoppedRef.current = false;

    runQueue(items, {
      onItemStart: (id) => updateStatus(id, 'running'),
      onItemDone: (id, results) => {
        updateStatus(id, 'done');
        setResults((prev) => [...prev, ...results]);

        // Auto-download all generated images via background service worker
        if (settingsRef.current.autoDownload) {
          results.forEach((result, i) => {
            const suffix = results.length > 1 ? `-${i + 1}` : '';
            browser.runtime.sendMessage({
              type: 'DOWNLOAD_IMAGE',
              payload: {
                imageUrl: result.imageUrl,
                filename: `${sanitizeFilename(result.prompt)}${suffix}-${Date.now()}.png`,
                folder: settingsRef.current.downloadFolder,
              },
            });
          });
        }
      },
      onItemFailed: (id, error) => updateStatus(id, 'failed', error),
      onComplete: () => setIsRunning(false),
      getSettings: () => settingsRef.current,
      shouldPause: () => isPausedRef.current,
      shouldStop: () => isStoppedRef.current,
    });
  }, [items, updateStatus]);

  const pause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      isPausedRef.current = next;
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    setIsRunning(false);
  }, []);

  return {
    items,
    setItems,
    isRunning,
    setIsRunning,
    isPaused,
    setIsPaused,
    results,
    addItem,
    removeItem,
    updatePrompt,
    updateStatus,
    start,
    pause,
    stop,
  };
}

function createItem(prompt: string): QueueItem {
  return {
    id: crypto.randomUUID(),
    prompt,
    status: 'pending',
    createdAt: Date.now(),
  };
}

function sanitizeFilename(prompt: string): string {
  return prompt
    .slice(0, 50)
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
