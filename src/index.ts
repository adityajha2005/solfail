import express, { Request, Response } from "express";
import { DecodeRequest, Network } from "./types";
import { decodeTransactionFailure } from "./decoder";

const app = express();

const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || "1mb";
const RPC_TIMEOUT_MS = parseInt(process.env.RPC_TIMEOUT_MS || "30000", 10);

app.use(express.json({ limit: MAX_REQUEST_SIZE }));

app.use((err: any, req: Request, res: Response, next: any) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: "Invalid JSON payload or request too large",
    });
  }
  next(err);
});

const PORT = process.env.PORT || 3000;

app.post("/decode", async (req: Request, res: Response) => {
  try {
    const body = req.body as DecodeRequest;

    if (!body.transactionBase64 && !body.instructions) {
      return res.status(400).json({
        error: "Either transactionBase64 or instructions must be provided",
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
      const validNetworks: Network[] = ["mainnet-beta", "testnet", "devnet"];
      if (!validNetworks.includes(body.network)) {
        return res.status(400).json({
          error: `Invalid network. Must be one of: ${validNetworks.join(", ")}`,
        });
      }
    }

    const result = await decodeTransactionFailure(body, RPC_TIMEOUT_MS);

    res.json(result);
  } catch (error: any) {
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

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Supported networks: mainnet-beta (default), testnet, devnet`);
});

