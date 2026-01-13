"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFailureHash = generateFailureHash;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates a deterministic failure hash for tracking and aggregation
 * Format: sf_<category_prefix>_<short_hash>
 * Example: sf_cb_91af2e (for compute_budget_exceeded)
 */
function generateFailureHash(failureCategory, errorCode, errorMessage) {
    // Create a stable fingerprint from key components
    const fingerprint = [
        failureCategory,
        errorCode || '',
        // Normalize error message - remove variable parts like account addresses, numbers
        normalizeErrorMessage(errorMessage || ''),
    ].join(':');
    // Generate short hash (6 chars is enough for collision resistance at scale)
    const hash = crypto_1.default
        .createHash('sha256')
        .update(fingerprint)
        .digest('hex')
        .substring(0, 6);
    // Create category prefix (first letters of each word in category)
    const prefix = getCategoryPrefix(failureCategory);
    return `sf_${prefix}_${hash}`;
}
/**
 * Normalizes error messages by removing variable components
 * This ensures the same type of error generates the same hash
 */
function normalizeErrorMessage(message) {
    return message
        // Remove Solana addresses (base58)
        .replace(/[1-9A-HJ-NP-Za-km-z]{32,44}/g, 'ADDRESS')
        // Remove hex addresses
        .replace(/0x[a-fA-F0-9]{8,}/g, 'HEX')
        // Remove numbers (like instruction indices)
        .replace(/\b\d+\b/g, 'N')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}
/**
 * Generates a short category prefix from the failure category
 */
function getCategoryPrefix(category) {
    const prefixes = {
        compute_budget_exceeded: 'cb',
        missing_signer: 'ms',
        account_not_writable: 'anw',
        account_not_rent_exempt: 'anre',
        incorrect_pda: 'ipda',
        program_panic: 'pp',
        anchor_constraint_owner: 'aco',
        anchor_constraint_seeds: 'acs',
        anchor_constraint_mut: 'acm',
        unknown: 'unk',
    };
    return prefixes[category] || 'unk';
}
//# sourceMappingURL=fingerprint.js.map