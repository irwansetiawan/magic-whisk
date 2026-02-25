export interface QueueItem {
  id: string;
  prompt: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  error?: string;
  createdAt: number;
}

export interface ResultItem {
  id: string;
  queueItemId: string;
  prompt: string;
  imageUrl: string;
  downloadPath?: string;
  createdAt: number;
}

export interface LogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface Settings {
  delayBetweenGenerations: number;
  autoDownload: boolean;
  downloadFolder: string;
}

export const DEFAULT_SETTINGS: Settings = {
  delayBetweenGenerations: 5000,
  autoDownload: true,
  downloadFolder: 'magic-whisk',
};
