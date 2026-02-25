import { useState, useCallback, useEffect, useRef } from 'react';
import type { QueueItem, ResultItem, LogEntry, Settings } from '@/src/shared/types';
import { queueStorage, resultsStorage, logsStorage } from '@/src/shared/storage';
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

  // Load persisted state on mount
  useEffect(() => {
    Promise.all([
      queueStorage.getValue(),
      resultsStorage.getValue(),
      logsStorage.getValue(),
    ]).then(([storedItems, storedResults, storedLogs]) => {
      if (storedItems?.length) {
        // Reset any stale 'running' items to 'pending' (from a previous crash/close)
        const fixed = storedItems.map((item) =>
          item.status === 'running' ? { ...item, status: 'pending' as const } : item
        );
        setItems(fixed);
      }
      if (storedResults?.length) setResults(storedResults);
      if (storedLogs?.length) setLogs(storedLogs);
    });
  }, []);

  // Persist items whenever they change
  useEffect(() => { queueStorage.setValue(items); }, [items]);
  useEffect(() => { resultsStorage.setValue(results); }, [results]);
  useEffect(() => { logsStorage.setValue(logs); }, [logs]);

  const addLog = useCallback((message: string, type: LogEntry['type']) => {
    setLogs((prev) => [...prev, { timestamp: Date.now(), message, type }]);
  }, []);

  const updateStatus = useCallback((id: string, status: QueueItem['status'], error?: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, error } : item))
    );
  }, []);

  const launchRunner = useCallback((allItems: QueueItem[]) => {
    setItems(allItems);
    setBulkText('');
    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    isStoppedRef.current = false;

    const pendingCount = allItems.filter((i) => i.status === 'pending').length;
    addLog(`Starting queue (${pendingCount} pending prompt${pendingCount !== 1 ? 's' : ''})`, 'info');

    runQueue(allItems, {
      onItemStart: (id) => {
        updateStatus(id, 'running');
        const item = allItems.find((i) => i.id === id);
        if (item) addLog(`Running: "${item.prompt}"`, 'info');
      },
      onItemDone: async (id, resultItems) => {
        updateStatus(id, 'done');
        setResults((prev) => [...prev, ...resultItems]);
        const item = allItems.find((i) => i.id === id);
        if (item) addLog(`Done: "${item.prompt}" (${resultItems.length} image${resultItems.length !== 1 ? 's' : ''})`, 'success');

        if (settingsRef.current.autoDownload) {
          for (let i = 0; i < resultItems.length; i++) {
            const result = resultItems[i];
            const suffix = resultItems.length > 1 ? `-${i + 1}` : '';
            const filename = `${sanitizeFilename(result.prompt)}${suffix}-${Date.now()}.png`;
            addLog(`Downloading: ${filename}`, 'info');
            try {
              const response = await browser.runtime.sendMessage({
                type: 'DOWNLOAD_IMAGE',
                payload: {
                  imageUrl: result.imageUrl,
                  filename,
                  folder: settingsRef.current.downloadFolder,
                },
              });
              if (!response?.success) {
                addLog(`Download failed: ${response?.error ?? 'unknown error'}`, 'error');
              }
            } catch (err) {
              addLog(`Download failed: ${err}`, 'error');
            }
          }
        }
      },
      onItemFailed: (id, error) => {
        updateStatus(id, 'failed', error);
        const item = allItems.find((i) => i.id === id);
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
  }, [updateStatus, addLog]);

  const parseNewItems = (): QueueItem[] => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l !== '');
    return lines.map(createItem);
  };

  const start = useCallback(() => {
    if (items.length > 0) return;
    const newItems = parseNewItems();
    if (newItems.length === 0) return;
    launchRunner(newItems);
  }, [bulkText, items.length, launchRunner]);

  const startOver = useCallback(() => {
    const resetExisting = items.map((item) => ({ ...item, status: 'pending' as const, error: undefined }));
    const newItems = parseNewItems();
    launchRunner([...resetExisting, ...newItems]);
  }, [bulkText, items, launchRunner]);

  const resume = useCallback(() => {
    const newItems = parseNewItems();
    const allItems = [...items, ...newItems];
    const hasPending = allItems.some((i) => i.status === 'pending');
    if (!hasPending) return;
    launchRunner(allItems);
  }, [bulkText, items, launchRunner]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

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
    setItems((prev) =>
      prev.map((item) => (item.status === 'running' ? { ...item, status: 'pending' as const } : item))
    );
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
    startOver,
    resume,
    pause,
    stop,
    removeItem,
    clearItems,
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
