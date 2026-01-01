# Fixtures

Test fixtures for validating error decoding behavior. Each fixture contains:

- `input`: Request payload (transactionBase64 or instructions)
- `expectedOutput`: Expected decoder response
- `simulation`: Mock simulation result (for testing)

## Golden Fixture ⭐

**`devnet_program_panic_real_tx.json`** - Real failed transaction from Solana devnet
- **Source**: Actual blockchain transaction (not mock data)
- **Signature**: `2Fnq3DTWf7wQcYCMCbV7L5z9Nxxrvh8kFgTfohmB3z59uyRV4HdmhvNq7AqrWNLhYpvk2kTqJ7dFwPXgkrvk2PUU`
- **Purpose**: Regression guard and credibility artifact
- **Status**: Verified against real RPC simulation

This fixture proves the decoder works with **real chain data**, not just theoretical cases.

## Usage

These fixtures are used for:
- Manual testing and validation
- Future automated test suite
- Documentation examples
- Regression testing
- **Credibility validation** (real transaction data)

## Structure

Each fixture represents a real-world error scenario with:
- Actual error patterns from Solana transactions
- Expected decoder categorization
- Confidence levels and explanations

## Adding Fixtures

When adding new error mappings, create a corresponding fixture:
1. Use real transaction logs when possible
2. Include both input and expected output
3. Match the exact error format from simulation
4. For golden fixtures, include transaction signature and explorer link

