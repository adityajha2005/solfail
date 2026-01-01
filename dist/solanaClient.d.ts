export interface SimulationResult {
    error: string | {
        [key: string]: any;
    } | null;
    logs: string[];
    unitsConsumed?: number;
}
export declare function simulateTransaction(rpcUrl: string, transactionBase64?: string, instructions?: Array<{
    programId: string;
    accounts: string[];
    data: string;
}>, timeoutMs?: number): Promise<SimulationResult>;
export declare function extractErrorDetails(error: SimulationResult["error"]): {
    errorCode: string | null;
    errorMessage: string | null;
};
//# sourceMappingURL=solanaClient.d.ts.map