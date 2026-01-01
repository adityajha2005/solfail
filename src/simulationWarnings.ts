import { SimulationResult } from "./solanaClient";

export function detectSimulationLimitations(
  simulation: SimulationResult,
  errorCode: string | null,
  errorMessage: string | null,
  logs: string[]
): string | null {
  const warnings: string[] = [];

  if (logs.length > 0) {
    const logText = logs.join(" ").toLowerCase();

    if (
      logText.includes("slot") ||
      logText.includes("blockheight") ||
      logText.includes("block height")
    ) {
      warnings.push("slot-dependent");
    }

    if (
      logText.includes("clock") ||
      logText.includes("timestamp") ||
      logText.includes("time") ||
      logText.includes("unix timestamp")
    ) {
      warnings.push("time-dependent");
    }

    if (
      logText.includes("already processed") ||
      logText.includes("duplicate") ||
      logText.includes("replay")
    ) {
      warnings.push("already-executed");
    }
  }

  if (errorMessage) {
    const errorLower = errorMessage.toLowerCase();

    if (
      errorLower.includes("blockhash") ||
      errorLower.includes("block hash") ||
      errorLower.includes("recent blockhash")
    ) {
      warnings.push("blockhash-expired");
    }

    if (
      errorLower.includes("already in use") ||
      errorLower.includes("already processed") ||
      errorLower.includes("duplicate")
    ) {
      warnings.push("already-executed");
    }

    if (
      errorLower.includes("slot") ||
      errorLower.includes("blockheight") ||
      errorLower.includes("epoch")
    ) {
      warnings.push("slot-dependent");
    }

    if (
      errorLower.includes("clock") ||
      errorLower.includes("timestamp") ||
      errorLower.includes("time constraint")
    ) {
      warnings.push("time-dependent");
    }
  }

  if (errorCode) {
    if (errorCode === "0x1" && logs.some((log) => log.toLowerCase().includes("blockhash"))) {
      warnings.push("blockhash-expired");
    }
  }

  if (warnings.length > 0) {
    return "This failure may depend on runtime state and may not reproduce in simulation.";
  }

  return null;
}

