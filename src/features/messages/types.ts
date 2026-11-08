import type { Message, MediaFile } from '@/shared/types';

export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface ChatMessage extends Omit<Message, 'content'> {
  content: string | null;
  media?: MediaFile | null;
  mediaSignedUrl?: string | null;
  status?: MessageStatus;
  localId?: string;
}

export interface SendTextMessageParams {
  content: string;
}

export interface SendVoiceNoteParams {
  uri?: string;
  fileBytes?: Uint8Array | Blob;
  durationSeconds: number;
  fileName?: string;
}

export interface SendPhotoMessageParams {
  uri: string;
  caption?: string;
}

