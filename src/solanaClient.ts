import {
  Connection,
  Transaction,
  PublicKey,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";

export interface SimulationResult {
  error: string | { [key: string]: any } | null;
  logs: string[];
  unitsConsumed?: number;
}

export async function fetchTransactionBySignature(
  rpcUrl: string,
  signature: string,
  timeoutMs: number = 30000
): Promise<string> {
  const connection = new Connection(rpcUrl, "confirmed");

  const fetchPromise = connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Timeout: Failed to fetch transaction")), timeoutMs)
  );

  let tx;
  try {
    tx = await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.message?.includes("Timeout")) {
      throw new Error(`Failed to fetch transaction: RPC request timed out after ${timeoutMs}ms. The transaction may not exist or the RPC endpoint may be slow.`);
    }
    if (error.message?.includes("ECONNREFUSED") || error.message?.includes("ENOTFOUND")) {
      throw new Error(`Failed to fetch transaction: RPC endpoint unreachable (${rpcUrl}). Check your network connection.`);
    }
    if (error.message?.includes("fetch failed")) {
      throw new Error(`Failed to fetch transaction: Network error connecting to RPC (${rpcUrl}). The transaction may not exist on this network or the RPC endpoint may be unavailable.`);
    }
    throw new Error(`Failed to fetch transaction: ${error.message || "Transaction not found or RPC error"}`);
  }

  if (!tx || !tx.transaction) {
    throw new Error("Transaction not found or invalid");
  }

  let transactionBase64: string;

  if (tx.transaction instanceof Transaction) {
    const serialized = tx.transaction.serialize({ requireAllSignatures: false });
    transactionBase64 = Buffer.from(serialized).toString("base64");
  } else if (tx.transaction instanceof VersionedTransaction) {
    const serialized = tx.transaction.serialize();
    transactionBase64 = Buffer.from(serialized).toString("base64");
  } else if (tx.transaction && typeof tx.transaction === "object" && "message" in tx.transaction) {
    try {
      const versionedTx = new VersionedTransaction(
        tx.transaction.message,
        Array.isArray(tx.transaction.signatures)
          ? tx.transaction.signatures.map((sig: any) => {
              if (sig instanceof Uint8Array && sig.length === 64) {
                return sig;
              } else if (typeof sig === "string") {
                const bs58 = require("bs58");
                return bs58.decode(sig);
              } else {
                throw new Error(`Invalid signature format: expected Uint8Array[64] or base58 string, got ${typeof sig}`);
              }
            })
          : []
      );
      transactionBase64 = Buffer.from(versionedTx.serialize()).toString("base64");
    } catch (error: any) {
      throw new Error(`Failed to reconstruct versioned transaction: ${error.message}`);
    }
  } else {
    throw new Error("Transaction not found or invalid");
  }

  return transactionBase64;
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

