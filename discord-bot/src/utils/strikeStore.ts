/**
 * Lightweight In-Memory Strike Store
 * 
 * Optimized specifically for mobile environments (Termux on Android).
 * Uses a native JavaScript Map with TTL expiration to keep RAM usage minimal (<2MB)
 * and eliminates heavy disk/database I/O.
 */

export interface StrikeRecord {
  userId: string;
  guildId: string;
  count: number;
  lastStrikeTimestamp: number;
  history: Array<{
    timestamp: number;
    reason: string;
    layer: "LAYER_1_REGEX" | "LAYER_2_GEMINI" | "MANUAL_STAFF";
  }>;
}

class StrikeStore {
  private strikes: Map<string, StrikeRecord> = new Map();
  private readonly defaultTtlMs: number;
  private readonly maxStrikesBeforeAction: number;

  constructor() {
    const ttlMinutes = parseInt(process.env.STRIKE_TTL_MINUTES || "60", 10);
    this.defaultTtlMs = ttlMinutes * 60 * 1000;
    this.maxStrikesBeforeAction = parseInt(process.env.MAX_STRIKES_BEFORE_TIMEOUT || "3", 10);

    // Periodic sweep every 10 minutes to prevent memory leak in long-running Termux sessions
    setInterval(() => this.pruneExpired(), 10 * 60 * 1000).unref();
  }

  private getKey(guildId: string, userId: string): string {
    return `${guildId}:${userId}`;
  }

  /**
   * Records a new strike against a user.
   * Returns the updated strike record and a boolean indicating if max threshold was hit.
   */
  public addStrike(
    guildId: string,
    userId: string,
    reason: string,
    layer: "LAYER_1_REGEX" | "LAYER_2_GEMINI" | "MANUAL_STAFF"
  ): { record: StrikeRecord; thresholdReached: boolean } {
    const key = this.getKey(guildId, userId);
    const now = Date.now();
    let record = this.strikes.get(key);

    if (!record || (now - record.lastStrikeTimestamp > this.defaultTtlMs)) {
      record = {
        userId,
        guildId,
        count: 1,
        lastStrikeTimestamp: now,
        history: [{ timestamp: now, reason, layer }],
      };
    } else {
      record.count += 1;
      record.lastStrikeTimestamp = now;
      record.history.push({ timestamp: now, reason, layer });
      // Keep history bounded to last 5 entries to save memory on mobile
      if (record.history.length > 5) {
        record.history.shift();
      }
    }

    this.strikes.set(key, record);
    const thresholdReached = record.count >= this.maxStrikesBeforeAction;

    return { record, thresholdReached };
  }

  /**
   * Retrieves current strike count for a user in a guild.
   */
  public getStrikes(guildId: string, userId: string): StrikeRecord | null {
    const key = this.getKey(guildId, userId);
    const record = this.strikes.get(key);
    if (!record) return null;

    // Verify if expired
    if (Date.now() - record.lastStrikeTimestamp > this.defaultTtlMs) {
      this.strikes.delete(key);
      return null;
    }

    return record;
  }

  /**
   * Clears all strikes for a user.
   */
  public clearStrikes(guildId: string, userId: string): boolean {
    return this.strikes.delete(this.getKey(guildId, userId));
  }

  /**
   * Prunes stale strikes to reclaim memory.
   */
  public pruneExpired(): number {
    const now = Date.now();
    let prunedCount = 0;
    for (const [key, record] of this.strikes.entries()) {
      if (now - record.lastStrikeTimestamp > this.defaultTtlMs) {
        this.strikes.delete(key);
        prunedCount++;
      }
    }
    return prunedCount;
  }

  /**
   * Returns total active records in memory.
   */
  public getActiveCount(): number {
    return this.strikes.size;
  }
}

export const strikeStore = new StrikeStore();
