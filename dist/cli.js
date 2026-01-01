#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const API_URL = process.env.API_URL || "http://localhost:3000";
async function readStdin() {
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
function parseArgs() {
    const args = process.argv.slice(2);
    let file;
    let stdin = false;
    let help = false;
    let network;
    let strong = false;
    let json = false;
    let pretty = false;
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "decode") {
            continue;
        }
        else if (arg === "-f" || arg === "--file") {
            file = args[++i];
        }
        else if (arg === "-" || arg === "--stdin") {
            stdin = true;
        }
        else if (arg === "-n" || arg === "--network") {
            const net = args[++i];
            if (net === "mainnet-beta" || net === "testnet" || net === "devnet") {
                network = net;
            }
            else {
                throw new Error(`Invalid network: ${net}. Must be one of: mainnet-beta, testnet, devnet`);
            }
        }
        else if (arg === "--mainnet") {
            network = "mainnet-beta";
        }
        else if (arg === "--testnet") {
            network = "testnet";
        }
        else if (arg === "--devnet") {
            network = "devnet";
        }
        else if (arg === "--strong") {
            strong = true;
        }
        else if (arg === "--json") {
            json = true;
        }
        else if (arg === "--pretty") {
            pretty = true;
        }
        else if (arg === "-h" || arg === "--help") {
            help = true;
        }
        else if (!arg.startsWith("-") && !file) {
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
  API_URL                 API endpoint URL (default: http://localhost:3000)

Input Format:
  JSON with either:
    - transactionBase64: string
    - instructions: array of {programId, accounts, data}
    - network: "mainnet-beta" | "testnet" | "devnet" (optional)

Examples:
  # From file (mainnet)
  solfail decode tx.json

  # From file (devnet with strong mode)
  solfail decode tx.json --devnet --strong

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
async function loadInput(file, stdin) {
    if (file) {
        try {
            return fs.readFileSync(file, "utf-8");
        }
        catch (error) {
            if (error.code === "ENOENT") {
                throw new Error(`File not found: ${file}`);
            }
            throw new Error(`Failed to read file: ${error.message}`);
        }
    }
    else if (stdin || !process.stdin.isTTY) {
        return await readStdin();
    }
    else {
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
        const request = JSON.parse(input.trim());
        if (network) {
            request.network = network;
        }
        if (strong) {
            request.strongMode = true;
        }
        const response = await fetch(`${API_URL}/decode`, {
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
        const result = await response.json();
        if (json || pretty) {
            console.log(JSON.stringify(result, null, pretty ? 2 : 0));
        }
        else {
            console.log(JSON.stringify(result, null, 2));
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("Error:", message);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=cli.js.map