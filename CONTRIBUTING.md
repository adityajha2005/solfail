# Contributing Error Mappings

This project welcomes community contributions to expand error detection coverage. All mappings are manually reviewed before inclusion.

## How to Contribute

### 1. Prepare Your Submission

For each error mapping, provide:

- **Log Sample**: Real program logs from a failed transaction
- **Error Type**: The failure category (or propose a new one)
- **Explanation**: Plain English explanation (1-2 lines)
- **Fix**: Practical suggestion (1 line)
- **Patterns**: Error codes, log patterns, or error message patterns that match

### 2. Submission Format

Create a JSON entry following this structure:

```json
{
  "category": "YOUR_CATEGORY",
  "confidence": "high",
  "explanation": "Clear explanation of what went wrong",
  "likelyFix": "Actionable fix suggestion",
  "source": "community",
  "matchers": [
    {
      "type": "logPattern",
      "pattern": "regex pattern or string"
    },
    {
      "type": "errorMessage",
      "pattern": "error message pattern"
    }
  ]
}
```

### 3. Where to Submit

- **GitHub Issues**: Open an issue with the label `error-mapping`
- **Pull Request**: Submit a PR modifying `src/errorMappings.ts`

Include in your submission:
- Real transaction logs (sanitized if needed)
- Error response from simulation
- Context about the program/use case

### 4. Review Process

- **Manual review only** - no auto-merge
- Maintainers verify patterns against real transactions
- May request additional test cases
- Approved mappings are added with `source: "community"`

### 5. Guidelines

**Do:**
- Use real, reproducible error patterns
- Provide clear explanations
- Include multiple matcher types when possible (logPattern > errorMessage > errorCode)
- Test your patterns before submitting

**Don't:**
- Submit overly broad patterns that cause false positives
- Include sensitive data in logs
- Submit mappings for program-specific errors (use UNKNOWN category instead)

### 6. Example Submission

```json
{
  "category": "ACCOUNT_NOT_RENT_EXEMPT",
  "confidence": "high",
  "explanation": "Account does not have sufficient lamports to be rent-exempt.",
  "likelyFix": "Fund the account with enough lamports to meet rent-exempt minimum.",
  "source": "community",
  "matchers": [
    {
      "type": "logPattern",
      "pattern": "/insufficient funds for rent/i"
    },
    {
      "type": "errorMessage",
      "pattern": "/InsufficientFundsForRent/i"
    }
  ]
}
```

## Transparency

All community mappings are marked with `source: "community"` and exposed in API responses via the `mappingSource` field. This transparency builds trust and acknowledges community contributions.

