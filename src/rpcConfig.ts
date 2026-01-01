import { Network } from "./types";

export const RPC_ENDPOINTS: Record<Network, string> = {
  "mainnet-beta":
    process.env.MAINNET_RPC_URL ?? "https://api.mainnet-beta.solana.com",
  testnet: process.env.TESTNET_RPC_URL ?? "https://api.testnet.solana.com",
  devnet: process.env.DEVNET_RPC_URL ?? "https://api.devnet.solana.com",
};

export function getRpcUrl(network: Network = "mainnet-beta"): string {
  return RPC_ENDPOINTS[network];
}

