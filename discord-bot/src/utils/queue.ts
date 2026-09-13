/**
 * Decoupled Background Task Queue
 * 
 * Ensures all Gemini AI operations execute entirely off the primary Discord event loop.
 * Slash commands and Gateway events will NEVER suffer latency or blocking from API calls.
 */

export interface ModerationJob {
  id: string;
  messageId: string;
  channelId: string;
  guildId: string;
  authorId: string;
  authorTag: string;
  content: string;
  createdAt: number;
  execute: () => Promise<void>;
}

class ModerationTaskQueue {
  private queue: ModerationJob[] = [];
  private inFlight = 0;
  private readonly maxConcurrency: number;
  private readonly maxQueueLength = 50; // Protect Termux memory from flood/raids
  private totalProcessed = 0;
  private totalDropped = 0;

  constructor() {
    this.maxConcurrency = parseInt(process.env.AI_QUEUE_CONCURRENCY || "2", 10);
  }

  /**
   * Enqueues a moderation task and triggers worker asynchronously.
   * Returns immediately (fire-and-forget).
   */
  public enqueue(job: ModerationJob): boolean {
    if (this.queue.length >= this.maxQueueLength) {
      this.totalDropped++;
      console.warn(`[Queue Backpressure] Queue full (${this.maxQueueLength}). Dropping message ${job.messageId} to preserve memory.`);
      return false;
    }

    this.queue.push(job);
    // Trigger tick asynchronously in next microtask
    queueMicrotask(() => this.processNext());
    return true;
  }

  private async processNext(): Promise<void> {
    if (this.inFlight >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    if (!job) return;

    this.inFlight++;

    try {
      await job.execute();
      this.totalProcessed++;
    } catch (err: any) {
      console.error(`[Queue Error] Worker job ${job.id} failed:`, err?.message || err);
    } finally {
      this.inFlight--;
      // Continue draining queue
      queueMicrotask(() => this.processNext());
    }
  }

  public getStats() {
    return {
      pending: this.queue.length,
      inFlight: this.inFlight,
      totalProcessed: this.totalProcessed,
      totalDropped: this.totalDropped,
    };
  }
}

export const moderationQueue = new ModerationTaskQueue();
