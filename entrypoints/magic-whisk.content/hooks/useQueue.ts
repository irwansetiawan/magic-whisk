import { useState, useCallback, useRef } from 'react';
import type { QueueItem, ResultItem, LogEntry, Settings } from '@/src/shared/types';
import { runQueue } from '@/src/automation/runner';

export function useQueue(settings: Settings) {
  const [bulkText, setBulkText] = useState('');
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const isPausedRef = useRef(false);
  const isStoppedRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
    setLogs((prev) => [...prev, { timestamp: Date.now(), message, type }]);
  }, []);

  const updateStatus = useCallback((id: string, status: QueueItem['status'], error?: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, error } : item))
    );
  }, []);

  const start = useCallback(() => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l !== '');
    if (lines.length === 0) return;

    const queueItems = lines.map(createItem);
    setItems(queueItems);
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isStoppedRef.current = false;

    addLog(`Starting queue (${lines.length} prompts)`, 'info');

    runQueue(queueItems, {
      onItemStart: (id) => {
        updateStatus(id, 'running');
        const item = queueItems.find((i) => i.id === id);
        if (item) addLog(`Running: "${item.prompt}"`, 'info');
      },
      onItemDone: (id, resultItems) => {
        updateStatus(id, 'done');
        setResults((prev) => [...prev, ...resultItems]);
        const item = queueItems.find((i) => i.id === id);
        if (item) addLog(`Done: "${item.prompt}" (${resultItems.length} image${resultItems.length !== 1 ? 's' : ''})`, 'success');

        if (settingsRef.current.autoDownload) {
          resultItems.forEach((result, i) => {
            const suffix = resultItems.length > 1 ? `-${i + 1}` : '';
            const filename = `${sanitizeFilename(result.prompt)}${suffix}-${Date.now()}.png`;
            addLog(`Downloading: ${filename}`, 'info');
            browser.runtime.sendMessage({
              type: 'DOWNLOAD_IMAGE',
              payload: {
                imageUrl: result.imageUrl,
                filename,
                folder: settingsRef.current.downloadFolder,
              },
            });
          });
        }
      },
      onItemFailed: (id, error) => {
        updateStatus(id, 'failed', error);
        const item = queueItems.find((i) => i.id === id);
        if (item) addLog(`Failed: "${item.prompt}" — ${error}`, 'error');
      },
      onComplete: () => {
        setIsRunning(false);
        addLog('Queue complete', 'info');
      },
      getSettings: () => settingsRef.current,
      shouldPause: () => isPausedRef.current,
      shouldStop: () => isStoppedRef.current,
    });
  }, [bulkText, updateStatus, addLog]);

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
    bulkText,
    setBulkText,
    items,
    isRunning,
    isPaused,
    results,
    logs,
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
