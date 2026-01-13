// Library entry point - exports for use as a dependency
export { decodeTransactionFailure } from './decoder';
export type {
  DecodeRequest,
  DecodeResponse,
  FailureCategory,
  Confidence,
  Network,
  MatchedBy,
  Status,
} from './types';

// v2: Failure Intelligence exports
export { getAggregationManager } from './aggregation';
export type { FailureAggregation } from './aggregation';
export { generateFailureHash } from './fingerprint';

