"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const decoder_1 = require("./decoder");
const app = (0, express_1.default)();
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || "1mb";
const RPC_TIMEOUT_MS = parseInt(process.env.RPC_TIMEOUT_MS || "30000", 10);
app.use(express_1.default.json({ limit: MAX_REQUEST_SIZE }));
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && "body" in err) {
        return res.status(400).json({
            error: "Invalid JSON payload or request too large",
        });
    }
    next(err);
});
const PORT = process.env.PORT || 3000;
app.post("/decode", async (req, res) => {
    try {
        const body = req.body;
        if (!body.signature && !body.transactionBase64 && !body.instructions) {
            return res.status(400).json({
                error: "Either signature, transactionBase64, or instructions must be provided",
            });
        }
        if (body.transactionBase64) {
            const sizeBytes = Buffer.byteLength(body.transactionBase64, "utf8");
            const maxSizeBytes = 1024 * 1024;
            if (sizeBytes > maxSizeBytes) {
                return res.status(400).json({
                    error: `Transaction base64 exceeds maximum size of ${maxSizeBytes} bytes`,
                });
            }
        }
        if (body.instructions) {
            if (!Array.isArray(body.instructions) || body.instructions.length === 0) {
                return res.status(400).json({
                    error: "instructions must be a non-empty array",
                });
            }
            if (body.instructions.length > 100) {
                return res.status(400).json({
                    error: "Maximum 100 instructions allowed per request",
                });
            }
            for (const ix of body.instructions) {
                if (!ix.programId || !ix.accounts || !ix.data) {
                    return res.status(400).json({
                        error: "Each instruction must have programId, accounts, and data fields",
                    });
                }
                if (ix.accounts.length > 64) {
                    return res.status(400).json({
                        error: "Maximum 64 accounts per instruction",
                    });
                }
            }
        }
        if (body.network) {
            const validNetworks = ["mainnet-beta", "testnet", "devnet"];
            if (!validNetworks.includes(body.network)) {
                return res.status(400).json({
                    error: `Invalid network. Must be one of: ${validNetworks.join(", ")}`,
                });
            }
        }
        const result = await (0, decoder_1.decodeTransactionFailure)(body, RPC_TIMEOUT_MS);
        // v2: Add failure intelligence headers
        if (result.status === 'FAILURE_DETECTED' && result.failureHash) {
            res.set('X-Solfail-Hash', result.failureHash);
            if (result.seenCount !== undefined) {
                res.set('X-Solfail-Seen-Count', result.seenCount.toString());
            }
            if (result.failureCategory) {
                res.set('X-Solfail-Category', result.failureCategory);
            }
        }
        res.json(result);
    }
    catch (error) {
        if (error.message?.includes("timeout") || error.message?.includes("Timeout")) {
            return res.status(504).json({
                error: "RPC request timed out. The Solana RPC endpoint did not respond in time.",
            });
        }
        if (error.message?.includes("simulation failed to execute")) {
            return res.status(400).json({
                error: "Transaction simulation failed to execute. The transaction may be malformed or the RPC endpoint is unavailable.",
            });
        }
        res.status(500).json({
            error: error.message || "Internal server error",
        });
    }
});
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Supported networks: mainnet-beta (default), testnet, devnet`);
});
//# sourceMappingURL=index.js.map