#!/usr/bin/env node

import { DecodeRequest, Network } from "./types";
import { decodeTransactionFailure } from "./decoder";
import * as fs from "fs";

const API_URL = process.env.API_URL;
const USE_API = process.env.USE_API === "true" || !!API_URL;

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let input = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      input += chunk;
    });
    process.stdin.on("end", () => {
      resolve(input.trim());
    });
    process.stdin.on("error", reject);
  });
}

function parseArgs(): {
  file?: string;
  stdin: boolean;
  help: boolean;
  network?: Network;
  strong: boolean;
  json: boolean;
  pretty: boolean;
} {
  const args = process.argv.slice(2);
  let file: string | undefined;
  let stdin = false;
  let help = false;
  let network: Network | undefined;
  let strong = false;
  let json = false;
  let pretty = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "decode") {
      continue;
    } else if (arg === "-f" || arg === "--file") {
      file = args[++i];
    } else if (arg === "-" || arg === "--stdin") {
      stdin = true;
    } else if (arg === "-n" || arg === "--network") {
      const net = args[++i];
      if (net === "mainnet-beta" || net === "testnet" || net === "devnet") {
        network = net;
      } else {
        throw new Error(
          `Invalid network: ${net}. Must be one of: mainnet-beta, testnet, devnet`
        );
      }
    } else if (arg === "--mainnet") {
      network = "mainnet-beta";
    } else if (arg === "--testnet") {
      network = "testnet";
    } else if (arg === "--devnet") {
      network = "devnet";
    } else if (arg === "--strong") {
      strong = true;
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--pretty") {
      pretty = true;
    } else if (arg === "-h" || arg === "--help") {
      help = true;
    } else if (!arg.startsWith("-") && !file) {
      // File argument (can be anywhere, not just last)
      file = arg;
    }
  }

  return { file, stdin, help, network, strong, json, pretty };
}

function printHelp() {
  console.log(`
Usage: solfail decode [options] [file]

Decode Solana transaction failures via API.

Options:
  -f, --file <path>       Read transaction from file (JSON)
  -,  --stdin            Read transaction from stdin
  --mainnet              Use mainnet (default)
  --testnet              Use testnet
  --devnet               Use devnet
  --strong               Enable strong mode (include confidenceScore)
  --json                 Force JSON output
  --pretty               Pretty print JSON output
  -h,  --help            Show this help message

Environment Variables:
  API_URL                 API endpoint URL (if set, CLI will call API instead of decoding locally)
  USE_API                  Set to "true" to force API mode (default: false - uses local decoder)

Input Format:
  JSON with either:
    - signature: string (transaction signature - will fetch from RPC)
    - transactionBase64: string
    - instructions: array of {programId, accounts, data}
    - network: "mainnet-beta" | "testnet" | "devnet" (optional)

Examples:
  # From file (mainnet)
  solfail decode tx.json

  # From file (devnet with strong mode)
  solfail decode tx.json --devnet --strong

  # Using signature (fetches from RPC)
  echo '{"signature":"2Fnq3DTWf7wQcYCMCbV7L5z9Nxxrvh8kFgTfohmB3z59uyRV4HdmhvNq7AqrWNLhYpvk2kTqJ7dFwPXgkrvk2PUU","network":"devnet"}' | solfail decode

  # Pipe input
  cat tx.json | solfail decode | jq '.failureCategory'

  # Pretty output
  solfail decode tx.json --pretty

  # Network flags
  solfail decode tx.json --testnet
  solfail decode tx.json --mainnet

Output:
  JSON response with failureCategory, explanation, likelyFix, etc.
`);
}

async function loadInput(file?: string, stdin?: boolean): Promise<string> {
  if (file) {
    try {
      return fs.readFileSync(file, "utf-8");
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw new Error(`File not found: ${file}`);
      }
      throw new Error(`Failed to read file: ${error.message}`);
    }
  } else if (stdin || !process.stdin.isTTY) {
    return await readStdin();
  } else {
    throw new Error("No input provided. Use -f <file>, --stdin, or pipe input.");
  }
}

async function main() {
  const { file, stdin, help, network, strong, json, pretty } = parseArgs();

  if (help) {
    printHelp();
    process.exit(0);
  }

  try {
    const input = await loadInput(file, stdin);
    if (!input || input.trim().length === 0) {
      throw new Error("Input is empty");
    }
    const request: DecodeRequest = JSON.parse(input.trim());

    if (network) {
      request.network = network;
    }

    if (strong) {
      request.strongMode = true;
    }

    let result;
    if (USE_API) {
      const apiUrl = API_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/decode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        const errorMsg = typeof errorData === "object" && errorData !== null && "error" in errorData
          ? String(errorData.error)
          : `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      result = await response.json();
    } else {
      result = await decodeTransactionFailure(request);
    }

    if (json || pretty) {
      console.log(JSON.stringify(result, null, pretty ? 2 : 0));
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    process.exit(1);
  }
}

main();

