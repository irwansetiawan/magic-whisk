// src/shared/messages.ts

export interface DownloadImageMessage {
  type: 'DOWNLOAD_IMAGE';
  payload: {
    imageUrl: string;
    filename: string;
    folder: string;
  };
}

export interface DownloadCompleteMessage {
  type: 'DOWNLOAD_COMPLETE';
  payload: {
    resultId: string;
    downloadPath: string;
  };
}

export type Message = DownloadImageMessage | DownloadCompleteMessage;
