import { ErrorMapping } from "./types";
export declare const ERROR_MAPPINGS: ErrorMapping[];
export interface MatchResult {
    mapping: ErrorMapping;
    matchedBy: "logPattern" | "errorMessage" | "errorCode";
    confidenceScore: number;
}
export declare function scoreToConfidence(score: number): "high" | "likely" | "uncertain";
export declare function findMatchingError(errorCode: string | null, errorMessage: string | null, logs: string[]): MatchResult | null;
//# sourceMappingURL=errorMappings.d.ts.map