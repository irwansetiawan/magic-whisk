import { useState, useCallback, useRef } from 'react';
import type { QueueItem, ResultItem } from '@/src/shared/types';
import { DEFAULT_SETTINGS } from '@/src/shared/types';
import { runQueue } from '@/src/automation/runner';

export function useQueue() {
  const [items, setItems] = useState<QueueItem[]>([
    createItem(''),
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);

  const isPausedRef = useRef(false);
  const isStoppedRef = useRef(false);

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
      onItemDone: (id, result) => {
        updateStatus(id, 'done');
        setResults((prev) => [...prev, result]);
      },
      onItemFailed: (id, error) => updateStatus(id, 'failed', error),
      onComplete: () => setIsRunning(false),
      getSettings: () => DEFAULT_SETTINGS,
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
