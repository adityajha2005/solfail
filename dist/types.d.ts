export type Confidence = "high" | "likely" | "uncertain";
export type FailureCategory = "compute_budget_exceeded" | "missing_signer" | "account_not_writable" | "account_not_rent_exempt" | "incorrect_pda" | "program_panic" | "anchor_constraint_owner" | "anchor_constraint_seeds" | "anchor_constraint_mut" | "unknown";
export type Status = "SIMULATION_OK" | "FAILURE_DETECTED";
export type Network = "mainnet-beta" | "testnet" | "devnet";
export interface DecodeRequest {
    signature?: string;
    transactionBase64?: string;
    instructions?: Array<{
        programId: string;
        accounts: string[];
        data: string;
    }>;
    network?: Network;
    strongMode?: boolean;
}
export type MatchedBy = "logPattern" | "errorMessage" | "errorCode" | "fallback";
export interface DecodeResponse {
    status: Status;
    failureCategory?: FailureCategory;
    confidence?: Confidence;
    explanation?: string;
    likelyFix?: string;
    rawError?: string;
    matchedBy?: MatchedBy;
    confidenceScore?: number;
    note?: string;
    mappingSource?: "core" | "community";
    failureHash?: string;
    firstSeen?: string;
    seenCount?: number;
    lastSeen?: string;
}
export interface ErrorMapping {
    category: FailureCategory;
    confidence: Confidence;
    explanation: string;
    likelyFix: string;
    source: "core" | "community";
    matchers: Array<{
        type: "errorCode" | "logPattern" | "errorMessage";
        pattern: string | RegExp;
    }>;
}
//# sourceMappingURL=types.d.ts.map