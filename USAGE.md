# How to Use in Your Project

## Installation

```bash
# As a dependency
npm install solfail

# Or globally for CLI
npm install -g solfail
```

## Three Ways to Use

### 1. As a Library (Recommended)

**Best for:** TypeScript/JavaScript projects, wallets, dApps

```typescript
import { decodeTransactionFailure } from 'solfail';
import type { DecodeRequest, DecodeResponse } from 'solfail';

const result = await decodeTransactionFailure({
  transactionBase64: txBase64,
  network: 'devnet',
  strongMode: true
});

if (result.status === 'FAILURE_DETECTED') {
  console.log(result.failureCategory); // e.g., "program_panic"
  console.log(result.explanation);
  console.log(result.likelyFix);
}
```

### 2. CLI Tool

**Best for:** Development, debugging, scripts

```bash
# After global install
solfail decode tx.json --devnet

# Or with npx (no install)
npx solfail decode tx.json --devnet --strong

# Pipe to jq
solfail decode tx.json | jq '.failureCategory'
```

### 3. HTTP API

**Best for:** Microservices, multi-language projects

```bash
# Start server
npm start

# Call from any language
curl -X POST http://localhost:3000/decode \
  -H "Content-Type: application/json" \
  -d '{"transactionBase64": "...", "network": "devnet"}'
```

## Common Use Cases

### Wallet Integration

```typescript
import { decodeTransactionFailure } from 'sol-pro';

async function showUserFriendlyError(signature: string) {
  const tx = await connection.getTransaction(signature);
  const txBase64 = Buffer.from(tx.serialize()).toString('base64');
  
  const decoded = await decodeTransactionFailure({
    transactionBase64: txBase64,
    network: 'mainnet-beta'
  });
  
  if (decoded.status === 'FAILURE_DETECTED') {
    // Show user-friendly message
    alert(`${decoded.explanation}\n\nFix: ${decoded.likelyFix}`);
  }
}
```

### dApp Frontend

```typescript
// Call your decoder service
const response = await fetch('https://your-service.com/decode', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    transactionBase64: failedTx,
    network: 'devnet'
  })
});

const result = await response.json();
// Handle result...
```

### Development Scripts

```bash
# Quick debugging
solfail decode failed-tx.json --devnet

# Batch processing
for tx in *.json; do
  solfail decode "$tx" | jq '.failureCategory'
done
```

### CI/CD

```yaml
- name: Check transaction failures
  run: |
    npm install -g sol-pro
    solfail decode test-tx.json --devnet | \
      jq -r '.failureCategory' | \
      grep -q "unknown" && exit 1 || exit 0
```

## TypeScript Support

Full TypeScript types are included:

```typescript
import type {
  DecodeRequest,
  DecodeResponse,
  FailureCategory,
  Network,
  Confidence
} from 'sol-pro';

// Type-safe usage
const request: DecodeRequest = {
  transactionBase64: '...',
  network: 'devnet' as Network
};

const result: DecodeResponse = await decodeTransactionFailure(request);
```

## Stable Category IDs

Use category IDs in your logic - they're stable and won't change:

```typescript
if (result.failureCategory === 'missing_signer') {
  // Handle missing signer
} else if (result.failureCategory === 'compute_budget_exceeded') {
  // Handle compute budget
}
```

Available categories:
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

