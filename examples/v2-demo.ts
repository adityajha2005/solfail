/**
 * Solfail v2 Demo - Failure Intelligence
 * 
 * This demonstrates the new v2 features:
 * - Deterministic failure hashing
 * - Automatic aggregation tracking
 * - Analytics API
 */

import { decodeTransactionFailure, getAggregationManager, generateFailureHash } from '../src/lib';

async function demoV2Features() {
  console.log('🚀 Solfail v2 Demo - Failure Intelligence\n');

  // Demo 1: Decode with failure intelligence
  console.log('📊 Demo 1: Decoding with Failure Intelligence');
  console.log('============================================\n');

  // Simulate a compute budget exceeded error
  // (In real usage, you'd use actual transaction data)
  const mockResponse = {
    status: 'FAILURE_DETECTED' as const,
    failureCategory: 'compute_budget_exceeded' as const,
    confidence: 'high' as const,
    explanation: 'Transaction exceeded the compute unit limit allocated for execution.',
    likelyFix: 'Reduce transaction complexity or increase compute budget limit.',
    failureHash: 'sf_cb_91af2e',
    firstSeen: '2026-01-10T08:00:00.000Z',
    seenCount: 134,
    lastSeen: new Date().toISOString(),
  };

  console.log('Response:', JSON.stringify(mockResponse, null, 2));
  console.log('\n✅ Notice the new v2 fields:');
  console.log(`   - failureHash: ${mockResponse.failureHash}`);
  console.log(`   - seenCount: ${mockResponse.seenCount}`);
  console.log(`   - firstSeen: ${mockResponse.firstSeen}`);

  // Demo 2: Generate failure hash
  console.log('\n\n🔑 Demo 2: Generating Failure Hashes');
  console.log('====================================\n');

  const hash1 = generateFailureHash('compute_budget_exceeded', '0x1', 'compute budget exceeded');
  const hash2 = generateFailureHash('missing_signer', '0x2', 'missing required signature');
  const hash3 = generateFailureHash('program_panic', '0x1', 'program panicked');

  console.log('Hash examples:');
  console.log(`  compute_budget_exceeded → ${hash1}`);
  console.log(`  missing_signer → ${hash2}`);
  console.log(`  program_panic → ${hash3}`);

  // Demo 3: Aggregation API
  console.log('\n\n📈 Demo 3: Aggregation Analytics API');
  console.log('====================================\n');

  const manager = getAggregationManager();

  // Simulate recording some failures
  console.log('Recording sample failures...');
  manager.recordFailure('sf_cb_91af2e', 'compute_budget_exceeded');
  manager.recordFailure('sf_cb_91af2e', 'compute_budget_exceeded');
  manager.recordFailure('sf_ms_a3f12c', 'missing_signer');
  manager.recordFailure('sf_pp_7d8e4f', 'program_panic');
  manager.recordFailure('sf_pp_7d8e4f', 'program_panic');
  manager.recordFailure('sf_pp_7d8e4f', 'program_panic');

  console.log('\nTop failures:');
  const topFailures = manager.getTopFailures(3);
  topFailures.forEach((failure, idx) => {
    console.log(`\n${idx + 1}. ${failure.failureCategory}`);
    console.log(`   Hash: ${failure.failureHash}`);
    console.log(`   Seen: ${failure.seenCount} times`);
    console.log(`   First: ${failure.firstSeen}`);
    console.log(`   Last: ${failure.lastSeen}`);
  });

  // Demo 4: Use cases
  console.log('\n\n💡 Demo 4: Real-World Use Cases');
  console.log('================================\n');

  console.log('Use Case 1: Wallet Error Grouping');
  console.log('  → Group errors by failureHash to show users common issues');
  console.log('  → Display seenCount to indicate how widespread the error is\n');

  console.log('Use Case 2: Infrastructure Spike Detection');
  console.log('  → Monitor seenCount over time');
  console.log('  → Alert when a specific failureHash spikes suddenly\n');

  console.log('Use Case 3: Dashboard Analytics');
  console.log('  → Query getAllAggregations() for comprehensive stats');
  console.log('  → Build visualizations of error distribution\n');

  console.log('Use Case 4: HTTP Headers Integration');
  console.log('  → X-Solfail-Hash: sf_cb_91af2e');
  console.log('  → X-Solfail-Seen-Count: 134');
  console.log('  → X-Solfail-Category: compute_budget_exceeded\n');

  // Demo 5: Migration path
  console.log('\n🔄 Demo 5: Migration from v1 to v2');
  console.log('===================================\n');

  console.log('✅ v2 is fully backward compatible!');
  console.log('✅ All v1 code continues to work');
  console.log('✅ New v2 fields are optional\n');

  console.log('Example migration:');
  console.log(`
// v1 code (still works)
const result = await decodeTransactionFailure({ transactionBase64: '...' });
console.log(result.failureCategory); // ✅ Works

// v2 enhancement (add when ready)
if (result.failureHash) {
  console.log('Failure hash:', result.failureHash); // ✅ New
  console.log('Seen count:', result.seenCount);     // ✅ New
}
  `.trim());

  console.log('\n\n✨ Solfail v2 Demo Complete!');
  console.log('============================\n');
  console.log('From "decoder" to "failure intelligence"');
  console.log('Ready for production use! 🚀\n');
}

// Run demo
if (require.main === module) {
  demoV2Features().catch(console.error);
}

export { demoV2Features };
