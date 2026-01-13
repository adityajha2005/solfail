import { FailureCategory } from './types';
/**
 * Generates a deterministic failure hash for tracking and aggregation
 * Format: sf_<category_prefix>_<short_hash>
 * Example: sf_cb_91af2e (for compute_budget_exceeded)
 */
export declare function generateFailureHash(failureCategory: FailureCategory, errorCode: string | null, errorMessage: string | null): string;
//# sourceMappingURL=fingerprint.d.ts.map