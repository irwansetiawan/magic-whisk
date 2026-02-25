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

export type AspectRatio = '1:1' | '9:16' | '16:9';

export interface Settings {
  delayBetweenGenerations: number;
  autoDownload: boolean;
  downloadFolder: string;
  aspectRatio: AspectRatio;
}

export const DEFAULT_SETTINGS: Settings = {
  delayBetweenGenerations: 5000,
  autoDownload: true,
  downloadFolder: 'magic-whisk',
  aspectRatio: '1:1',
};
