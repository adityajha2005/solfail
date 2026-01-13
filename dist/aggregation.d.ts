import { FailureCategory } from './types';
export interface FailureAggregation {
    failureHash: string;
    failureCategory: FailureCategory;
    firstSeen: string;
    seenCount: number;
    lastSeen: string;
}
declare class AggregationManager {
    private store;
    private storePath;
    private isDirty;
    private saveInterval;
    constructor();
    /**
     * Load aggregation data from disk
     */
    private load;
    /**
     * Save aggregation data to disk
     */
    private save;
    /**
     * Record a failure occurrence and return updated aggregation data
     */
    recordFailure(failureHash: string, failureCategory: FailureCategory): FailureAggregation;
    /**
     * Get aggregation data for a specific failure hash
     */
    getAggregation(failureHash: string): FailureAggregation | null;
    /**
     * Get all aggregations (useful for analytics/dashboards)
     */
    getAllAggregations(): FailureAggregation[];
    /**
     * Get aggregations sorted by frequency (most common failures)
     */
    getTopFailures(limit?: number): FailureAggregation[];
    /**
     * Clean up resources
     */
    shutdown(): void;
}
export declare function getAggregationManager(): AggregationManager;
export {};
//# sourceMappingURL=aggregation.d.ts.map