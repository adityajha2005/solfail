"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RPC_ENDPOINTS = void 0;
exports.getRpcUrl = getRpcUrl;
exports.RPC_ENDPOINTS = {
    "mainnet-beta": process.env.MAINNET_RPC_URL ?? "https://api.mainnet-beta.solana.com",
    testnet: process.env.TESTNET_RPC_URL ?? "https://api.testnet.solana.com",
    devnet: process.env.DEVNET_RPC_URL ?? "https://api.devnet.solana.com",
};
function getRpcUrl(network = "mainnet-beta") {
    return exports.RPC_ENDPOINTS[network];
}
//# sourceMappingURL=rpcConfig.js.map