import { useState, useCallback } from 'react';
import type { QueueItem } from '@/src/shared/types';

export function useQueue() {
  const [items, setItems] = useState<QueueItem[]>([
    createItem(''),
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

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

  return {
    items,
    setItems,
    isRunning,
    setIsRunning,
    isPaused,
    setIsPaused,
    addItem,
    removeItem,
    updatePrompt,
    updateStatus,
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
