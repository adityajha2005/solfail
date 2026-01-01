import {
  Connection,
  Transaction,
  PublicKey,
  TransactionInstruction,
} from "@solana/web3.js";

export interface SimulationResult {
  error: string | { [key: string]: any } | null;
  logs: string[];
  unitsConsumed?: number;
}

export async function simulateTransaction(
  rpcUrl: string,
  transactionBase64?: string,
  instructions?: Array<{
    programId: string;
    accounts: string[];
    data: string;
  }>,
  timeoutMs: number = 30000
): Promise<SimulationResult> {
  const connection = new Connection(rpcUrl, "confirmed");

  let transaction: Transaction;

  if (transactionBase64) {
    const txBuffer = Buffer.from(transactionBase64, "base64");
    transaction = Transaction.from(txBuffer);
  } else if (instructions) {
    transaction = new Transaction();

    const blockhashPromise = connection.getLatestBlockhash();
    const blockhashTimeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout: Failed to fetch blockhash")), timeoutMs)
    );
    const { blockhash } = await Promise.race([blockhashPromise, blockhashTimeout]) as { blockhash: string };
    transaction.recentBlockhash = blockhash;

    for (const ix of instructions) {
      const programId = new PublicKey(ix.programId);
      const accounts = ix.accounts.map((acc, idx) => ({
        pubkey: new PublicKey(acc),
        isSigner: idx === 0,
        isWritable: true,
      }));

      const dataBuffer = Buffer.from(ix.data, "base64");

      transaction.add(
        new TransactionInstruction({
          programId,
          keys: accounts,
          data: dataBuffer,
        })
      );
    }
  } else {
    throw new Error("Either transactionBase64 or instructions must be provided");
  }

  const simulationPromise = connection.simulateTransaction(transaction);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout: RPC simulation request timed out")), timeoutMs)
  );

  let simulation;
  try {
    simulation = await Promise.race([simulationPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.message?.includes("Timeout")) {
      throw error;
    }
    if (error.message?.includes("ECONNREFUSED") || error.message?.includes("ENOTFOUND")) {
      throw new Error("simulation failed to execute: RPC endpoint unreachable");
    }
    if (error.message?.includes("fetch failed") || error.message?.includes("network")) {
      throw new Error("simulation failed to execute: Network error connecting to RPC");
    }
    throw new Error(`simulation failed to execute: ${error.message || "Unknown error"}`);
  }

  if (!simulation || !simulation.value) {
    throw new Error("simulation failed to execute: Invalid response from RPC");
  }

  return {
    error: simulation.value.err,
    logs: simulation.value.logs || [],
    unitsConsumed: simulation.value.unitsConsumed || undefined,
  };
}

export function extractErrorDetails(
  error: SimulationResult["error"]
): {
  errorCode: string | null;
  errorMessage: string | null;
} {
  if (!error) {
    return { errorCode: null, errorMessage: null };
  }

  let errorCode: string | null = null;
  let errorMessage: string | null = null;

  if (typeof error === "string") {
    errorMessage = error;
  } else if (typeof error === "object" && error !== null) {
    if ("Custom" in error && typeof error.Custom === "number") {
      errorCode = `0x${error.Custom.toString(16)}`;
      errorMessage = `Custom error: ${error.Custom}`;
    } else if ("InstructionError" in error && Array.isArray(error.InstructionError)) {
      const [index, instructionError] = error.InstructionError;

      if (Array.isArray(instructionError) && instructionError.length >= 2) {
        const [errorType, errorValue] = instructionError;
        if (errorType === "Custom" && typeof errorValue === "number") {
          errorCode = `0x${errorValue.toString(16)}`;
          errorMessage = `Instruction ${index}: Custom error ${errorValue}`;
        } else {
          errorMessage = `Instruction ${index}: ${errorType} ${JSON.stringify(errorValue)}`;
        }
      } else if (typeof instructionError === "string") {
        errorMessage = `Instruction ${index}: ${instructionError}`;
      } else if (typeof instructionError === "object" && instructionError !== null) {
        const errorKeys = Object.keys(instructionError);
        if (errorKeys.length > 0) {
          const errorKey = errorKeys[0];
          const errorValue = instructionError[errorKey];
          errorMessage = `Instruction ${index}: ${errorKey} ${JSON.stringify(errorValue)}`;
        } else {
          errorMessage = `Instruction ${index} error: ${JSON.stringify(instructionError)}`;
        }
      } else {
        errorMessage = `Instruction ${index} error: ${JSON.stringify(instructionError)}`;
      }
    } else {
      errorMessage = JSON.stringify(error);
    }
  }

  if (!errorMessage) {
    errorMessage = JSON.stringify(error);
  }

  return { errorCode, errorMessage };
}

