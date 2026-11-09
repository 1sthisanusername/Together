import { AppState, AppStateStatus } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { queryClient } from './queryClient';

const QUEUE_FILE_PATH = `${FileSystem.documentDirectory || ''}together_offline_queue.json`;

export type MutationType = 'chat_message' | 'daily_question_answer' | 'vault_item';

export interface QueuedMutation {
  id: string;
  type: MutationType;
  payload: any;
  createdAt: number;
  attempts: number;
}

class OfflineQueueService {
  private queue: QueuedMutation[] = [];
  private isProcessing = false;
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadQueue();
    this.initialized = true;

    // Listen for app coming to foreground
    if (AppState && typeof AppState.addEventListener === 'function') {
      AppState.addEventListener('change', (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          this.processQueue();
        }
      });
    }

    // Attempt processing initial queue
    this.processQueue();
  }

  private async loadQueue(): Promise<void> {
    try {
      if (FileSystem.documentDirectory) {
        const info = await FileSystem.getInfoAsync(QUEUE_FILE_PATH);
        if (info.exists) {
          const raw = await FileSystem.readAsStringAsync(QUEUE_FILE_PATH);
          this.queue = JSON.parse(raw) || [];
        }
      }
    } catch {
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      if (FileSystem.documentDirectory) {
        await FileSystem.writeAsStringAsync(QUEUE_FILE_PATH, JSON.stringify(this.queue));
      }
    } catch {
      // Non-fatal
    }
  }

  public async enqueue(type: MutationType, payload: any): Promise<string> {
    if (!this.initialized) await this.loadQueue();

    const id = `mut_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mutation: QueuedMutation = {
      id,
      type,
      payload,
      createdAt: Date.now(),
      attempts: 0,
    };

    this.queue.push(mutation);
    await this.saveQueue();

    // Trigger process in background
    this.processQueue();
    return id;
  }

  public async processQueue(): Promise<{ processed: number; remaining: number }> {
    if (this.isProcessing || this.queue.length === 0) {
      return { processed: 0, remaining: this.queue.length };
    }

    this.isProcessing = true;
    let processedCount = 0;

    try {
      const remaining: QueuedMutation[] = [];

      for (const item of this.queue) {
        try {
          await this.executeMutation(item);
          processedCount++;
        } catch {
          // Increment attempt count
          item.attempts += 1;
          // Retain if fewer than 5 attempts
          if (item.attempts < 5) {
            remaining.push(item);
          }
        }
      }

      this.queue = remaining;
      await this.saveQueue();
    } finally {
      this.isProcessing = false;
    }

    return { processed: processedCount, remaining: this.queue.length };
  }

  private async executeMutation(item: QueuedMutation): Promise<void> {
    switch (item.type) {
      case 'chat_message': {
        const { error } = await supabase.from('messages').insert({
          couple_id: item.payload.coupleId,
          sender_id: item.payload.senderId,
          recipient_id: item.payload.recipientId,
          content: item.payload.content || null,
          media_id: item.payload.mediaId || null,
          idempotency_key: item.payload.idempotencyKey || null,
        });
        if (error) throw new Error(error.message);
        queryClient.invalidateQueries({ queryKey: ['messages', item.payload.coupleId] });
        break;
      }
      case 'daily_question_answer': {
        const { error } = await (supabase.from as any)('daily_question_answers').upsert({
          couple_id: item.payload.coupleId,
          question_id: item.payload.questionId,
          user_id: item.payload.userId,
          answer_text: item.payload.answerText,
          answered_at: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        queryClient.invalidateQueries({ queryKey: ['daily_question'] });
        break;
      }
      case 'vault_item': {
        const { error } = await (supabase.from as any)('vault_items').insert({
          couple_id: item.payload.coupleId,
          created_by: item.payload.userId,
          title: item.payload.title || null,
          content: item.payload.content,
          item_type: item.payload.itemType || 'secret',
        });
        if (error) throw new Error(error.message);
        queryClient.invalidateQueries({ queryKey: ['vault_items', item.payload.coupleId] });
        break;
      }
    }
  }

  public getPendingCount(): number {
    return this.queue.length;
  }

  public async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }
}

export const offlineQueue = new OfflineQueueService();
