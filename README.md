# Solfail

**Sol**ana transaction **fail**ure decoder - Decode Solana transaction failures with clear explanations and actionable fixes.

Minimal, infra-grade backend for decoding Solana transaction failures using `simulateTransaction` RPC.

## Installation

```bash
npm install solfail
```

Or install globally for CLI usage:

```bash
npm install -g solfail
```

## Quick Start

### Option 1: Use as a Library (Recommended for Projects)

```typescript
// Import the decoder function and types
import { decodeTransactionFailure } from 'solfail';
import type { DecodeRequest, DecodeResponse } from 'solfail';

// In your code
const request: DecodeRequest = {
  transactionBase64: failedTxBase64,
  network: 'devnet',
  strongMode: true
};

const result: DecodeResponse = await decodeTransactionFailure(request);

if (result.status === 'FAILURE_DETECTED') {
  console.log(`Error: ${result.failureCategory}`);
  console.log(`Fix: ${result.likelyFix}`);
  
  // Use stable category IDs in your logic
  if (result.failureCategory === 'missing_signer') {
    // Handle missing signer
  }
}
```

### Option 2: CLI Tool (Developer Workflow)

```bash
# After global install
solfail decode tx.json --devnet

# Or with npx (no install needed)
npx solfail decode tx.json --devnet --strong

# Pipe to jq for filtering
solfail decode tx.json | jq '.failureCategory'
```

### Option 3: HTTP API (Microservice)

```bash
# Start the server
npm start

# Or run as a service
node dist/index.js
```

Then call from any language:

```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{"transactionBase64": "YOUR_FAILED_TX_BASE64", "network": "devnet"}'
```

**What you get**: Instead of cryptic error codes like `{"InstructionError": [0, ["Custom", 6001]]}`, you get:
- Clear error category (`anchor_constraint_owner`)
- Plain English explanation
- Actionable fix suggestion
- Confidence level

## Usage in Your Project

### Installation

```bash
# As a dependency in your project
npm install solfail

# Or globally for CLI usage
npm install -g solfail
```

### 1. Use as a TypeScript/JavaScript Library

```typescript
// Import the decoder function and types
import { decodeTransactionFailure } from 'solfail';
import type { DecodeRequest, DecodeResponse } from 'solfail';

async function handleFailedTransaction(txBase64: string) {
  const request: DecodeRequest = {
    transactionBase64: txBase64,
    network: 'devnet',
    strongMode: true
  };
  
  const result: DecodeResponse = await decodeTransactionFailure(request);
  
  if (result.status === 'FAILURE_DETECTED') {
    // Use stable category IDs for conditional logic
    switch (result.failureCategory) {
      case 'missing_signer':
        return showSignerPrompt(result.likelyFix);
      case 'account_not_rent_exempt':
        return showFundingDialog(result.explanation);
      case 'compute_budget_exceeded':
        return suggestOptimization(result.likelyFix);
      default:
        return showGenericError(result.explanation);
    }
  }
  
  return { success: true };
}
```

### 2. In a Wallet Application

```typescript
import { decodeTransactionFailure } from 'solfail';
import { Connection } from '@solana/web3.js';

async function onTransactionError(signature: string, connection: Connection) {
  // Fetch failed transaction
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0
  });
  
  if (!tx?.transaction) return;
  
  // Serialize to base64
  const txBase64 = Buffer.from(
    tx.transaction.serialize({ requireAllSignatures: false })
  ).toString('base64');
  
  // Decode failure
  const decoded = await decodeTransactionFailure({
    transactionBase64: txBase64,
    network: 'mainnet-beta'
  });
  
  // Show user-friendly error
  if (decoded.status === 'FAILURE_DETECTED') {
    showErrorToast({
      title: decoded.failureCategory.replace(/_/g, ' '),
      message: decoded.explanation,
      action: decoded.likelyFix
    });
  }
}
```

### 3. In a dApp (Frontend)

```typescript
// React/Next.js example
async function handleTransactionError(txBase64: string) {
  const response = await fetch('http://your-decoder-service:3000/decode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionBase64: txBase64,
      network: 'devnet'
    })
  });
  
  const result = await response.json();
  
  if (result.status === 'FAILURE_DETECTED') {
    // Update UI based on error category
    setError({
      type: result.failureCategory,
      message: result.explanation,
      fix: result.likelyFix,
      confidence: result.confidence
    });
  }
}
```

### 4. CLI in Development Workflow

```bash
# After global install: solfail
solfail decode failed-tx.json --devnet

# Or with npx (no install needed)
npx solfail decode tx.json --devnet --strong

# Pipe to jq for filtering
solfail decode tx.json | jq '.failureCategory'

# Batch processing
for tx in *.json; do
  echo "Processing $tx:"
  solfail decode "$tx" --devnet | jq '.failureCategory'
done

# Integration with scripts
CATEGORY=$(solfail decode tx.json | jq -r '.failureCategory')
if [ "$CATEGORY" = "missing_signer" ]; then
  echo "Need to add signer"
fi
```

### 5. As a Standalone HTTP Service

```bash
# Start the decoder service
npm start

# Or run in production
PORT=3000 MAINNET_RPC_URL=https://your-rpc.com node dist/index.js
```

Then call from any language:

```bash
# From command line
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{"transactionBase64": "...", "network": "devnet"}'

# From Python
import requests
response = requests.post('http://localhost:3000/decode', json={
    'transactionBase64': tx_base64,
    'network': 'devnet'
})
result = response.json()
print(result['failureCategory'])

# From Go
resp, _ := http.Post("http://localhost:3000/decode", 
    "application/json",
    bytes.NewBuffer(jsonData))
```

### 6. In CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Decode failed transactions
  run: |
    npm install -g solfail
    for tx in failed-txs/*.json; do
      CATEGORY=$(solfail decode "$tx" --devnet | jq -r '.failureCategory')
      echo "Transaction $tx: $CATEGORY"
      
      # Fail build on critical errors
      if [ "$CATEGORY" = "missing_signer" ] || [ "$CATEGORY" = "account_not_rent_exempt" ]; then
        echo "::error::Critical error: $CATEGORY"
        exit 1
      fi
    done
```

### 7. Error Monitoring & Alerting

```typescript
// Monitor transaction failures
async function logTransactionFailure(signature: string) {
  const decoded = await decodeTransactionFailure({
    transactionBase64: await getTxBase64(signature),
    network: 'mainnet-beta'
  });
  
  if (decoded.status === 'FAILURE_DETECTED') {
    // Send to monitoring service
    await analytics.track('transaction_failure', {
      category: decoded.failureCategory,
      confidence: decoded.confidence,
      network: 'mainnet-beta'
    });
    
    // Alert on specific categories
    if (decoded.failureCategory === 'compute_budget_exceeded') {
      await sendAlert('Transaction optimization needed');
    }
  }
}
```

## Setup

```bash
npm install
npm run build
npm start
```

Or for development:

```bash
npm run dev
```

## Configuration

- `PORT`: Server port (defaults to 3000)
- `MAX_REQUEST_SIZE`: Maximum request body size (defaults to "1mb")
- `RPC_TIMEOUT_MS`: RPC request timeout in milliseconds (defaults to 30000)
- `MAINNET_RPC_URL`: Override mainnet RPC endpoint (defaults to public mainnet RPC)
- `TESTNET_RPC_URL`: Override testnet RPC endpoint (defaults to public testnet RPC)
- `DEVNET_RPC_URL`: Override devnet RPC endpoint (defaults to public devnet RPC)
- `STRONG_MODE`: Enable strong mode to expose `confidenceScore` in responses (defaults to false)

## Multi-Network Support

Decoding on devnet/testnet is fully supported and recommended during development.

**Supported Networks:**
- `mainnet-beta` (default)
- `testnet`
- `devnet`

**Network Selection:**
- HTTP API: Include `"network": "devnet"` in request body
- CLI: Use `-n devnet` flag or include `"network"` in JSON input
- Environment variables allow per-network RPC endpoint overrides

## CLI Usage

The CLI tool is a thin wrapper around the decoder logic - no duplication, same error mappings.

```bash
# Help
npm run cli -- --help

# From file
npm run cli -- -f transaction.json

# From stdin (pipe)
cat tx.json | npm run cli -- --stdin

# Auto-detect stdin when not TTY
echo '{"transactionBase64":"..."}' | npm run cli --

# Network selection (devnet)
npm run cli -- -f tx.json -n devnet

# Network selection (testnet)
npm run cli -- -f tx.json -n testnet

# Custom RPC endpoint for specific network
DEVNET_RPC_URL=https://custom-devnet-rpc.com npm run cli -- -f tx.json -n devnet

# Custom timeout
RPC_TIMEOUT_MS=60000 npm run cli -- -f tx.json
```

**Input Format** (JSON file or stdin):
```json
{
  "transactionBase64": "base64EncodedTransaction",
  "network": "devnet"
}
```

or

```json
{
  "instructions": [
    {
      "programId": "11111111111111111111111111111111",
      "accounts": ["Account1", "Account2"],
      "data": "base64Data"
    }
  ],
  "network": "testnet"
}
```

**Network field is optional** - defaults to `mainnet-beta` if omitted.

**Output**: JSON formatted response (pipe to `jq` for pretty formatting)

```bash
npm run cli -- -f tx.json | jq '.failureCategory'
```

## HTTP API Usage

### Endpoint: POST /decode

#### Option 1: Transaction Base64

```bash
# Mainnet (default)
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "transactionBase64": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDArj..."
  }'

# Devnet
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "transactionBase64": "...",
    "network": "devnet"
  }'
```

#### Option 2: Raw Instructions

```bash
# Testnet
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": [
      {
        "programId": "11111111111111111111111111111111",
        "accounts": ["AccountPubkey1", "AccountPubkey2"],
        "data": "base64EncodedInstructionData"
      }
    ],
    "network": "testnet"
  }'
```

## Response Format

**Failure Detected:**
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "missing_signer",
  "confidence": "likely",
  "explanation": "A required signer account was not included when submitting the transaction.",
  "likelyFix": "Ensure the missing account signs the transaction before sending.",
  "rawError": "{\"code\":2,\"message\":\"Instruction requires a signer\"}",
  "matchedBy": "errorMessage",
  "mappingSource": "core"
}
```

**Simulation Succeeded:**
```json
{
  "status": "SIMULATION_OK",
  "note": "No failure detected during simulation."
}
```

**With Strong Mode** (`STRONG_MODE=true` or `"strongMode": true` in request):
```json
{
  "failureCategory": "missing_signer",
  "confidence": "likely",
  "confidenceScore": 40,
  "explanation": "A required signer account was not included when submitting the transaction.",
  "likelyFix": "Ensure the missing account signs the transaction before sending.",
  "rawError": "{\"code\":2,\"message\":\"Instruction requires a signer\"}",
  "matchedBy": "errorMessage"
}
```

### Response Fields

- `status`: Response status (`SIMULATION_OK` or `FAILURE_DETECTED`)
- `failureCategory`: (When status is `FAILURE_DETECTED`) The identified error category - **Category IDs are stable and safe to depend on**
- `confidence`: (When status is `FAILURE_DETECTED`) Classification confidence level (`high`, `likely`, `uncertain`)
- `explanation`: (When status is `FAILURE_DETECTED`) Plain English explanation of the failure
- `likelyFix`: (When status is `FAILURE_DETECTED`) Practical suggestion to resolve the issue
- `rawError`: (When status is `FAILURE_DETECTED`) Original RPC error JSON for transparency
- `matchedBy`: (When status is `FAILURE_DETECTED`) Internal debugging field indicating which matcher type was used:
  - `logPattern`: Matched by program log pattern
  - `errorMessage`: Matched by error message pattern
  - `errorCode`: Matched by error code
  - `fallback`: No match found (unknown category)
- `confidenceScore`: (Strong mode only) Internal confidence score (0-100) for debugging
- `note`: (Optional) Warning when failure may depend on runtime state, or success message when simulation passes
- `mappingSource`: (When status is `FAILURE_DETECTED`) Source of the error mapping (`core` or `community`)

### Stable Category IDs

**Category IDs are stable and safe to depend on** for:
- Wallet UX logic (conditional UI based on error type)
- CI/CD rules (automated testing and validation)
- Alert routing (monitoring and notification systems)

All category IDs use lowercase with underscores (e.g., `compute_budget_exceeded`, `missing_signer`). These IDs will not change in future versions, making them safe for programmatic use.

### Confidence Scoring

Confidence is computed internally based on matcher type:
- **logPattern match**: Score 70 → `high` confidence
- **errorMessage match**: Score 40 → `likely` confidence
- **errorCode match**: Score 20 → `uncertain` confidence

The score is mapped to labels:
- `high`: Score ≥ 50
- `likely`: Score ≥ 30
- `uncertain`: Score < 30

**Strong Mode**: Enable via `STRONG_MODE=true` environment variable or `"strongMode": true` in request to expose `confidenceScore` field for debugging.

### Simulation Limitations

The decoder automatically detects cases where simulation may not accurately reflect real execution:

- **Slot-dependent logic**: Transactions that depend on specific slot numbers
- **Time-dependent logic**: Transactions that depend on Clock sysvar or timestamps
- **Blockhash expiration**: Transactions with expired recent blockhashes
- **Already-executed**: Transactions that were already processed

When detected, a `note` field is included:
```json
{
  "failureCategory": "account_not_rent_exempt",
  "confidence": "high",
  "explanation": "Account does not have sufficient lamports to be rent-exempt.",
  "likelyFix": "Fund the account with enough lamports to meet rent-exempt minimum.",
  "rawError": "...",
  "matchedBy": "errorMessage",
  "note": "This failure may depend on runtime state and may not reproduce in simulation."
}
```

**Detection covers:**
- Slot-dependent logic (slot numbers, blockheight checks)
- Time-dependent logic (Clock sysvar, timestamps)
- Blockhash expiration (recent blockhash too old)
- Already-executed transactions (duplicate/replay protection)

This transparency increases trust by clearly indicating when simulation results may differ from actual execution.

## Community Error Mappings

The decoder supports community-contributed error mappings to expand coverage. All mappings are manually reviewed before inclusion.

**How it works:**
- `errorMappings.ts` is the source of truth
- Contributors submit mappings via GitHub Issues or Pull Requests
- Manual review only - no auto-merge
- Approved mappings marked with `source: "community"`
- Exposed in responses via `mappingSource` field

**To contribute:**
1. Provide log sample, error type, explanation, and fix
2. Submit via GitHub Issue (label: `error-mapping`) or Pull Request
3. Include real transaction logs and error responses
4. Wait for manual review and approval

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed submission guidelines.

**Transparency = Trust**: All mappings show their source (`core` or `community`) in the response, building trust through transparency.

## Supported Error Categories

**Category IDs are stable and safe to depend on** for wallet UX, CI rules, and alert routing.

- `compute_budget_exceeded`
- `missing_signer`
- `account_not_writable`
- `account_not_rent_exempt`
- `incorrect_pda`
- `program_panic`
- `anchor_constraint_owner`
- `anchor_constraint_seeds`
- `anchor_constraint_mut`
- `unknown`

## Error Confidence Levels

- `high`: Error pattern matches with high certainty
- `likely`: Error pattern matches but may have edge cases
- `uncertain`: No matching pattern found, raw error provided for manual inspection

## Examples

### Example 1: Real Devnet Transaction Decoded ⭐

**This isn't theoretical. This already works on real chain data.**

**Real Transaction**:
- **Signature**: `2Fnq3DTWf7wQcYCMCbV7L5z9Nxxrvh8kFgTfohmB3z59uyRV4HdmhvNq7AqrWNLhYpvk2kTqJ7dFwPXgkrvk2PUU`
- **Network**: Devnet
- **Explorer**: [View on Solana Explorer](https://explorer.solana.com/tx/2Fnq3DTWf7wQcYCMCbV7L5z9Nxxrvh8kFgTfohmB3z59uyRV4HdmhvNq7AqrWNLhYpvk2kTqJ7dFwPXgkrvk2PUU?cluster=devnet)

**Before**: Raw RPC error is cryptic
```json
{
  "InstructionError": [0, {"Custom": 6204}]
}
```
*What does Custom:6204 mean? Is this a program panic? An assertion failure?*

**After**: Clear explanation with actionable fix
```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "transactionBase64": "AT7Ffhx5JGAUOp8HKs4nHAbZqAyHYE2nAF9j5Hi8djgqLwo+lzHIIJxKwC0DLCPGMb6EgDP8FIHlr3E6Z9S1/gkBAAgNC3AWSePHsFNdCL0v8pGHdEDmaq2r/fN92mA7ZuMS4gpU6FI9WzoLJyNtibMKva3By3X/68c8rDG119IChcMzk2vKinixtq0v0djypOXsZT2KCnt2PNcFYYNjnbIrFx3Xd6fjMDSS9IwBepLJyRP/oBcYLerJ5rwwgsN9YfcmmO7oO0CVyL2tyMV/PjCsjXIMG5pbe7D0CSxy3gDbcnh0jAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABN+teWL/sd2SXQqftebQDOYZW6i7OpH9B++YYMXpe7gFgXD/AeaMAXoF7Jol8HeB4aGuT5hXq7IGXUnmSQSXngan1RcYe9FmNdrUBFX9wsDBJMaPIVZ1pdu6y18IAAAAmIPIii/XvhfRiikWQLvN9NB0ICEkkPTvMHOJmXk9AxGhXNLxg+l6LWjByJzBy59n9aCSPFu50hceTih7PplBZdCX2Cp03WYcqUoQFOAOxKESRdDKPQlsIOQaSshprBQH4wo6Kq2KROQXYcxcMmyUvjPOm6momuVUKFc/y+vqEN60RGaFGM1EZyCiGAaNcJOOmnD3Sevd9plVu8HS4UR6vwQLCgAKBwMCAQQJBQhbC+Aq7ACaSqNNOdWmA5Z5BtNyFjb2mXVY4wo6Kq2KROQXYcxcMmyUvjPOm6momuVUKFc/y+vqEN4BAunpSF/GactpZpiYpKUYHPbMf1HS5U6QMl2PSZNnNRD/AAwGCwkHAgMICTkWkAA9NdpuAQYBAAwGAAAJ02jpAAAAAAQGAQAMBgAAM55p6QAAAAAF",
    "network": "devnet",
    "strongMode": true
  }'
```

**Response**:
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "program_panic",
  "confidence": "high",
  "explanation": "Program execution panicked, typically due to assertion failure or invalid state.",
  "likelyFix": "Review program logic and ensure all preconditions are met before execution.",
  "rawError": "{\"InstructionError\":[0,{\"Custom\":6204}]}",
  "matchedBy": "logPattern",
  "mappingSource": "core",
  "confidenceScore": 70
}
```

**What This Shows**:
- ✅ **Real blockchain data** - This transaction actually failed on devnet
- ✅ **Accurate detection** - Correctly identified as `program_panic` with high confidence
- ✅ **Actionable output** - Clear explanation and fix guidance
- ✅ **Production-ready** - Works with actual Solana transactions

**Use Case**: Validates the decoder works with real chain data, not just test cases.

---

### Example 2: Missing Signer

**Before**: Raw RPC error is cryptic
```json
{
  "InstructionError": [0, ["MissingRequiredSignature", {}]]
}
```

**After**: Clear explanation with actionable fix
```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "transactionBase64": "YOUR_FAILED_TX_BASE64"
  }'
```

**Response**:
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "missing_signer",
  "confidence": "high",
  "explanation": "A required signer account was not included when submitting the transaction.",
  "likelyFix": "Ensure the missing account signs the transaction before sending.",
  "rawError": "{\"InstructionError\":[0,[\"MissingRequiredSignature\",{}]]}",
  "matchedBy": "errorMessage",
  "mappingSource": "core"
}
```

**Use Case**: Wallet integration - quickly identify which account needs to sign.

---

### Example 3: Anchor Constraint Owner Violation (Devnet)

**Before**: Custom error code requires looking up Anchor error codes
```json
{
  "InstructionError": [0, ["Custom", 6001]]
}
```

**After**: Immediate understanding of the constraint violation
```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": [
      {
        "programId": "YourProgramId",
        "accounts": ["Account1", "Account2"],
        "data": "base64InstructionData"
      }
    ],
    "network": "devnet"
  }'
```

**Response**:
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "anchor_constraint_owner",
  "confidence": "high",
  "explanation": "Anchor constraint violation: account owner does not match expected program.",
  "likelyFix": "Verify the account is owned by the correct program or initialize it properly.",
  "rawError": "{\"InstructionError\":[0,[\"Custom\",6001]]}",
  "matchedBy": "logPattern",
  "mappingSource": "core"
}
```

**Use Case**: Anchor program debugging - no need to decode error code 6001 manually.

---

### Example 4: Compute Budget Exceeded

**Before**: Generic error with no context
```json
{
  "InstructionError": [0, ["ComputationalBudgetExceeded", {}]]
}
```

**After**: Clear explanation with optimization guidance
```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "transactionBase64": "YOUR_TX_BASE64"
  }'
```

**Response**:
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "compute_budget_exceeded",
  "confidence": "high",
  "explanation": "Transaction exceeded the compute unit limit allocated for execution.",
  "likelyFix": "Reduce transaction complexity or increase compute budget limit.",
  "rawError": "{\"InstructionError\":[0,[\"ComputationalBudgetExceeded\",{}]]}",
  "matchedBy": "errorMessage",
  "mappingSource": "core"
}
```

**Use Case**: Transaction optimization - understand why complex transactions fail.

---

### Example 4: Account Not Rent Exempt

**Before**: Unclear what "insufficient funds" means
```json
{
  "InstructionError": [0, ["InsufficientFundsForRent", {"accountIndex": 1}]]
}
```

**After**: Specific explanation about rent exemption
```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "transactionBase64": "YOUR_TX_BASE64"
  }'
```

**Response**:
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "account_not_rent_exempt",
  "confidence": "high",
  "explanation": "Account does not have sufficient lamports to be rent-exempt.",
  "likelyFix": "Fund the account with enough lamports to meet rent-exempt minimum.",
  "rawError": "{\"InstructionError\":[0,[\"InsufficientFundsForRent\",{\"accountIndex\":1}]]}",
  "matchedBy": "errorMessage",
  "mappingSource": "core"
}
```

**Use Case**: Account initialization - know exactly how much to fund.

---

### Example 5: Program Panic

**Before**: Generic custom error code
```json
{
  "InstructionError": [0, ["Custom", 1]]
}
```

**After**: Identified as program panic with context
```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "transactionBase64": "YOUR_TX_BASE64"
  }'
```

**Response**:
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "program_panic",
  "confidence": "high",
  "explanation": "Program execution panicked, typically due to assertion failure or invalid state.",
  "likelyFix": "Review program logic and ensure all preconditions are met before execution.",
  "rawError": "{\"InstructionError\":[0,[\"Custom\",1]]}",
  "matchedBy": "logPattern",
  "mappingSource": "core"
}
```

**Use Case**: Program debugging - distinguish between program logic errors and infrastructure issues.

---

### Example 6: Anchor Constraint Seeds (PDA Mismatch)

**Before**: Custom error code 6006 requires Anchor documentation lookup
```json
{
  "InstructionError": [0, ["Custom", 6006]]
}
```

**After**: Clear PDA seeds constraint violation
```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "instructions": [
      {
        "programId": "YourProgramId",
        "accounts": ["PDA1", "PDA2"],
        "data": "base64Data"
      }
    ]
  }'
```

**Response**:
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "anchor_constraint_seeds",
  "confidence": "high",
  "explanation": "Anchor constraint violation: PDA seeds do not match the constraint definition.",
  "likelyFix": "Ensure PDA seeds match the account constraint seeds exactly.",
  "rawError": "{\"InstructionError\":[0,[\"Custom\",6006]]}",
  "matchedBy": "logPattern",
  "mappingSource": "core"
}
```

**Use Case**: Anchor development - quickly identify PDA derivation issues.

---

### Example 7: Account Not Writable

**Before**: Unclear permission error
```json
{
  "InstructionError": [0, ["ReadonlyLamportChange", {}]]
}
```

**After**: Specific writable permission issue
```bash
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{
    "transactionBase64": "YOUR_TX_BASE64"
  }'
```

**Response**:
```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "account_not_writable",
  "confidence": "high",
  "explanation": "An account that must be writable was marked as read-only or not provided.",
  "likelyFix": "Ensure the account is included in the transaction with writable permission.",
  "rawError": "{\"InstructionError\":[0,[\"ReadonlyLamportChange\",{}]]}",
  "matchedBy": "errorMessage",
  "mappingSource": "core"
}
```

**Use Case**: Transaction construction - identify missing writable flags.

---

## Integration Examples

### Wallet Integration

```javascript
async function handleTransactionError(failedTx, network = 'mainnet-beta') {
  const response = await fetch('http://localhost:3000/decode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transactionBase64: failedTx,
      network: network // 'mainnet-beta', 'testnet', or 'devnet'
    })
  });
  
  const decoded = await response.json();
  
  if (decoded.status === 'SIMULATION_OK') {
    return; // No error to handle
  }
  
  if (decoded.failureCategory === 'missing_signer') {
    // Prompt user to sign with missing account
    return promptSigner(decoded.likelyFix);
  }
  
  if (decoded.failureCategory === 'account_not_rent_exempt') {
    // Show funding UI
    return showFundingDialog(decoded.explanation);
  }
  
  // Display user-friendly error
  showError(decoded.explanation, decoded.likelyFix);
}
```

### Example 3: Error Monitoring & Alerting

```typescript
// Monitor transaction failures in production
import { decodeTransactionFailure } from 'solfail';

async function logTransactionFailure(signature: string) {
  const decoded = await decodeTransactionFailure({
    transactionBase64: await getTxBase64(signature),
    network: 'mainnet-beta'
  });
  
  if (decoded.status === 'FAILURE_DETECTED') {
    // Send to analytics
    await analytics.track('transaction_failure', {
      category: decoded.failureCategory,
      confidence: decoded.confidence,
      network: 'mainnet-beta'
    });
    
    // Alert on specific categories
    if (decoded.failureCategory === 'compute_budget_exceeded') {
      await sendAlert('Transaction optimization needed');
    }
  }
}
```

**Or with CLI:**
```bash
# Decode and alert on specific categories
solfail decode failed-tx.json | jq -r '.failureCategory' | \
  grep -q "compute_budget_exceeded" && \
  echo "ALERT: Transaction optimization needed"
```

### Example 4: CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Decode transaction failures
  run: |
    npm install -g solfail
    for tx in failed-txs/*.json; do
      CATEGORY=$(solfail decode "$tx" --devnet | jq -r '.failureCategory')
      echo "Transaction $tx: $CATEGORY"
      
      # Fail build on critical errors
      if [ "$CATEGORY" = "missing_signer" ] || [ "$CATEGORY" = "account_not_rent_exempt" ]; then
        echo "::error::Critical error: $CATEGORY"
        exit 1
      fi
    done
```

### Example 5: Node.js Backend Service

```typescript
// Your backend service
import { decodeTransactionFailure } from 'solfail';
import express from 'express';

const app = express();

app.post('/api/transaction/analyze', async (req, res) => {
  const { transactionBase64, network } = req.body;
  
  try {
    const result = await decodeTransactionFailure({
      transactionBase64,
      network: network || 'mainnet-beta'
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Example 6: Python Integration

```python
# Using the HTTP API from Python
import requests

def decode_transaction(tx_base64, network='devnet'):
    response = requests.post(
        'http://localhost:3000/decode',
        json={
            'transactionBase64': tx_base64,
            'network': network
        }
    )
    return response.json()

# Usage
result = decode_transaction(tx_base64, 'devnet')
if result['status'] == 'FAILURE_DETECTED':
    print(f"Error: {result['failureCategory']}")
    print(f"Fix: {result['likelyFix']}")
```

