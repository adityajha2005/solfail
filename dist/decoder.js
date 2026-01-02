"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeTransactionFailure = decodeTransactionFailure;
const solanaClient_1 = require("./solanaClient");
const errorMappings_1 = require("./errorMappings");
const rpcConfig_1 = require("./rpcConfig");
const simulationWarnings_1 = require("./simulationWarnings");
const STRONG_MODE = process.env.STRONG_MODE === "true" || process.env.STRONG_MODE === "1";
async function decodeTransactionFailure(request, timeoutMs = 30000) {
    const network = request.network || "mainnet-beta";
    const rpcUrl = (0, rpcConfig_1.getRpcUrl)(network);
    const strongMode = request.strongMode ?? STRONG_MODE;
    let transactionBase64 = request.transactionBase64;
    if (request.signature) {
        transactionBase64 = await (0, solanaClient_1.fetchTransactionBySignature)(rpcUrl, request.signature, timeoutMs);
    }
    const simulation = await (0, solanaClient_1.simulateTransaction)(rpcUrl, transactionBase64, request.instructions, timeoutMs);
    if (!simulation.error) {
        return {
            status: "SIMULATION_OK",
            note: "No failure detected during simulation.",
        };
    }
    const { errorCode, errorMessage } = (0, solanaClient_1.extractErrorDetails)(simulation.error);
    const logs = simulation.logs || [];
    const rawError = JSON.stringify(simulation.error);
    const note = (0, simulationWarnings_1.detectSimulationLimitations)(simulation, errorCode, errorMessage, logs);
    const matchResult = (0, errorMappings_1.findMatchingError)(errorCode, errorMessage, logs);
    if (matchResult) {
        const confidence = (0, errorMappings_1.scoreToConfidence)(matchResult.confidenceScore);
        const response = {
            status: "FAILURE_DETECTED",
            failureCategory: matchResult.mapping.category,
            confidence,
            explanation: matchResult.mapping.explanation,
            likelyFix: matchResult.mapping.likelyFix,
            rawError,
            matchedBy: matchResult.matchedBy,
            mappingSource: matchResult.mapping.source,
        };
        if (strongMode) {
            response.confidenceScore = matchResult.confidenceScore;
        }
        if (note) {
            response.note = note;
        }
        return response;
    }
    const response = {
        status: "FAILURE_DETECTED",
        failureCategory: "unknown",
        confidence: "uncertain",
        explanation: "Unable to categorize this transaction failure with available error mappings.",
        likelyFix: "Review the rawError field and program logs for detailed failure information.",
        rawError,
        matchedBy: "fallback",
    };
    if (strongMode) {
        response.confidenceScore = 0;
    }
    if (note) {
        response.note = note;
    }
    return response;
}
//# sourceMappingURL=decoder.js.map