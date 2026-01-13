# Changelog

All notable changes to Solfail will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-01-13

### 🚀 Major Features - Failure Intelligence

**v2 transforms Solfail from "a decoder" into "failure intelligence"**

#### Added

- **Deterministic Failure Hashing** (`fingerprint.ts`)
  - Each failure type generates a unique, stable hash (format: `sf_<prefix>_<hash>`)
  - Examples: `sf_cb_91af2e` (compute budget), `sf_ms_a3f12c` (missing signer)
  - Hash generation normalizes variable components (addresses, numbers) for consistency
  - Category-specific prefixes for readability (cb, ms, pp, aco, etc.)

- **Automatic Failure Aggregation** (`aggregation.ts`)
  - Tracks `firstSeen`, `lastSeen`, and `seenCount` for each failure hash
  - JSON-based persistent storage (`.solfail-aggregation.json`)
  - In-memory caching for performance
  - Auto-save every 30 seconds with graceful shutdown handling
  - Analytics API: `getTopFailures()`, `getAllAggregations()`, `getAggregation(hash)`

- **Enhanced Response Schema**
  - New fields in `DecodeResponse`:
    - `failureHash` - Deterministic failure identifier
    - `firstSeen` - ISO 8601 timestamp of first occurrence
    - `seenCount` - Total number of occurrences
    - `lastSeen` - ISO 8601 timestamp of most recent occurrence

- **HTTP Headers Support**
  - `X-Solfail-Hash` - Failure hash for middleware integration
  - `X-Solfail-Seen-Count` - Occurrence count for monitoring
  - `X-Solfail-Category` - Failure category for quick filtering

- **Public API Exports** (via `lib.ts`)
  - `getAggregationManager()` - Access aggregation analytics
  - `generateFailureHash()` - Generate custom failure hashes
  - `FailureAggregation` type - Type definitions for aggregation data

- **Comprehensive Documentation**
  - `V2_FEATURES.md` - Complete guide to v2 features
  - `examples/v2-demo.ts` - Working examples and use cases
  - Use case examples: wallet error grouping, spike detection, dashboards

#### Changed

- **Package version** bumped to 2.0.0
- **Package description** updated to reflect "failure intelligence" positioning
- **`.gitignore`** updated to exclude aggregation data file

#### Backward Compatibility

✅ **100% backward compatible** - All v1 code continues to work without changes
- New v2 fields are optional and only appear when failures are detected
- Existing response fields unchanged
- No breaking changes to API signatures

### 🎯 Key Benefits

#### For Wallets
- Group identical errors across users
- Show frequency to help users understand common issues
- Detect patterns in transaction failures

#### For Infrastructure Teams
- Monitor error trends over time
- Detect spikes in specific error types
- Alert on anomalies (e.g., sudden increase in compute errors)
- Build dashboards and analytics

#### For Developers
- Debug with context (see how common an error is)
- Track fixes (monitor if error frequency decreases)
- Build intelligent error handling based on frequency

### 📊 Example Response (v2)

```json
{
  "status": "FAILURE_DETECTED",
  "failureCategory": "compute_budget_exceeded",
  "confidence": "high",
  "explanation": "Transaction exceeded the compute unit limit allocated for execution.",
  "likelyFix": "Reduce transaction complexity or increase compute budget limit.",
  "failureHash": "sf_cb_91af2e",
  "firstSeen": "2026-01-10T08:00:00.000Z",
  "seenCount": 134,
  "lastSeen": "2026-01-13T11:45:00.000Z"
}
```

### 🔒 Privacy & Security

- All tracking is **local** to your instance
- No data sent to external servers
- Addresses and sensitive data normalized/removed from hashes
- Aggregation data stored locally in `.solfail-aggregation.json`

---

## [1.0.1] - 2026-01-XX

### Fixed
- Minor bug fixes and improvements

## [1.0.0] - 2026-01-XX

### Added
- Initial release
- Transaction failure decoding
- Multiple error category support
- HTTP API server
- CLI tool
- TypeScript library
- Multi-network support (mainnet, testnet, devnet)
- Confidence scoring
- Community error mappings
- Simulation limitation detection

[2.0.0]: https://github.com/adityajha2005/solfail/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/adityajha2005/solfail/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/adityajha2005/solfail/releases/tag/v1.0.0
