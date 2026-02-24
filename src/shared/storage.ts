import { storage } from 'wxt/utils/storage';
import type { QueueItem, ResultItem, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

export const queueStorage = storage.defineItem<QueueItem[]>('local:queue', {
  fallback: [],
});

export const resultsStorage = storage.defineItem<ResultItem[]>('local:results', {
  fallback: [],
});

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});
