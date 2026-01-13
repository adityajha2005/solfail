import fs from 'fs';
import path from 'path';
import { FailureCategory } from './types';

export interface FailureAggregation {
  failureHash: string;
  failureCategory: FailureCategory;
  firstSeen: string; // ISO 8601 date string
  seenCount: number;
  lastSeen: string; // ISO 8601 date string
}

interface AggregationStore {
  [failureHash: string]: FailureAggregation;
}

class AggregationManager {
  private store: AggregationStore = {};
  private storePath: string;
  private isDirty = false;
  private saveInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Store aggregation data in a local file
    this.storePath = path.join(process.cwd(), '.solfail-aggregation.json');
    this.load();
    
    // Auto-save every 30 seconds if there are changes
    this.saveInterval = setInterval(() => {
      if (this.isDirty) {
        this.save();
      }
    }, 30000);
  }

  /**
   * Load aggregation data from disk
   */
  private load(): void {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = fs.readFileSync(this.storePath, 'utf-8');
        this.store = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load aggregation data:', error);
      this.store = {};
    }
  }

  /**
   * Save aggregation data to disk
   */
  private save(): void {
    try {
      fs.writeFileSync(this.storePath, JSON.stringify(this.store, null, 2), 'utf-8');
      this.isDirty = false;
    } catch (error) {
      console.error('Failed to save aggregation data:', error);
    }
  }

  /**
   * Record a failure occurrence and return updated aggregation data
   */
  recordFailure(
    failureHash: string,
    failureCategory: FailureCategory
  ): FailureAggregation {
    const now = new Date().toISOString();

    if (this.store[failureHash]) {
      // Update existing entry
      this.store[failureHash].seenCount += 1;
      this.store[failureHash].lastSeen = now;
    } else {
      // Create new entry
      this.store[failureHash] = {
        failureHash,
        failureCategory,
        firstSeen: now,
        seenCount: 1,
        lastSeen: now,
      };
    }

    this.isDirty = true;
    return this.store[failureHash];
  }

  /**
   * Get aggregation data for a specific failure hash
   */
  getAggregation(failureHash: string): FailureAggregation | null {
    return this.store[failureHash] || null;
  }

  /**
   * Get all aggregations (useful for analytics/dashboards)
   */
  getAllAggregations(): FailureAggregation[] {
    return Object.values(this.store);
  }

  /**
   * Get aggregations sorted by frequency (most common failures)
   */
  getTopFailures(limit: number = 10): FailureAggregation[] {
    return Object.values(this.store)
      .sort((a, b) => b.seenCount - a.seenCount)
      .slice(0, limit);
  }

  /**
   * Clean up resources
   */
  shutdown(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    if (this.isDirty) {
      this.save();
    }
  }
}

// Singleton instance
let instance: AggregationManager | null = null;

export function getAggregationManager(): AggregationManager {
  if (!instance) {
    instance = new AggregationManager();
  }
  return instance;
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  if (instance) {
    instance.shutdown();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (instance) {
    instance.shutdown();
  }
  process.exit(0);
});
