import {
  DecodeRequest,
  DecodeResponse,
  FailureCategory,
  Confidence,
} from "./types";
import { simulateTransaction, extractErrorDetails, fetchTransactionBySignature } from "./solanaClient";
import { findMatchingError, scoreToConfidence } from "./errorMappings";
import { getRpcUrl } from "./rpcConfig";
import { detectSimulationLimitations } from "./simulationWarnings";
import { generateFailureHash } from "./fingerprint";
import { getAggregationManager } from "./aggregation";

const STRONG_MODE = process.env.STRONG_MODE === "true" || process.env.STRONG_MODE === "1";

export async function decodeTransactionFailure(
  request: DecodeRequest,
  timeoutMs: number = 30000
): Promise<DecodeResponse> {
  const network = request.network || "mainnet-beta";
  const rpcUrl = getRpcUrl(network);
  const strongMode = request.strongMode ?? STRONG_MODE;

  let transactionBase64 = request.transactionBase64;

  if (request.signature) {
    transactionBase64 = await fetchTransactionBySignature(rpcUrl, request.signature, timeoutMs);
  }

  const simulation = await simulateTransaction(
    rpcUrl,
    transactionBase64,
    request.instructions,
    timeoutMs
  );

  if (!simulation.error) {
    return {
      status: "SIMULATION_OK",
      note: "No failure detected during simulation.",
    };
  }

  const { errorCode, errorMessage } = extractErrorDetails(simulation.error);
  const logs = simulation.logs || [];

  const rawError = JSON.stringify(simulation.error);

  const note = detectSimulationLimitations(
    simulation,
    errorCode,
    errorMessage,
    logs
  );

  const matchResult = findMatchingError(errorCode, errorMessage, logs);

  if (matchResult) {
    const confidence = scoreToConfidence(matchResult.confidenceScore);
    
    // Generate failure fingerprint/hash
    const failureHash = generateFailureHash(
      matchResult.mapping.category,
      errorCode,
      errorMessage
    );

    // Record failure and get aggregation data
    const aggregationManager = getAggregationManager();
    const aggregation = aggregationManager.recordFailure(
      failureHash,
      matchResult.mapping.category
    );
    
    const response: DecodeResponse = {
      status: "FAILURE_DETECTED",
      failureCategory: matchResult.mapping.category,
      confidence,
      explanation: matchResult.mapping.explanation,
      likelyFix: matchResult.mapping.likelyFix,
      rawError,
      matchedBy: matchResult.matchedBy,
      mappingSource: matchResult.mapping.source,
      // v2 Failure Intelligence
      failureHash: aggregation.failureHash,
      firstSeen: aggregation.firstSeen,
      seenCount: aggregation.seenCount,
      lastSeen: aggregation.lastSeen,
    };

    if (strongMode) {
      response.confidenceScore = matchResult.confidenceScore;
    }

    if (note) {
      response.note = note;
    }

    return response;
  }

  // Generate failure hash even for unknown errors
  const failureHash = generateFailureHash("unknown", errorCode, errorMessage);
  
  // Record failure and get aggregation data
  const aggregationManager = getAggregationManager();
  const aggregation = aggregationManager.recordFailure(failureHash, "unknown");

  const response: DecodeResponse = {
    status: "FAILURE_DETECTED",
    failureCategory: "unknown",
    confidence: "uncertain",
    explanation: "Unable to categorize this transaction failure with available error mappings.",
    likelyFix: "Review the rawError field and program logs for detailed failure information.",
    rawError,
    matchedBy: "fallback",
    // v2 Failure Intelligence
    failureHash: aggregation.failureHash,
    firstSeen: aggregation.firstSeen,
    seenCount: aggregation.seenCount,
    lastSeen: aggregation.lastSeen,
  };

  if (strongMode) {
    response.confidenceScore = 0;
  }

  if (note) {
    response.note = note;
  }

  return response;
}

