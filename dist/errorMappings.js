"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MAPPINGS = void 0;
exports.scoreToConfidence = scoreToConfidence;
exports.findMatchingError = findMatchingError;
exports.ERROR_MAPPINGS = [
    {
        category: "program_panic",
        confidence: "high",
        explanation: "Program execution panicked, typically due to assertion failure or invalid state.",
        likelyFix: "Review program logic and ensure all preconditions are met before execution.",
        source: "core",
        matchers: [
            {
                type: "logPattern",
                pattern: /panicked/i,
            },
            {
                type: "logPattern",
                pattern: /program.*failed/i,
            },
            {
                type: "errorMessage",
                pattern: /program.*panic/i,
            },
            {
                type: "errorCode",
                pattern: "0x1",
            },
        ],
    },
    {
        category: "compute_budget_exceeded",
        confidence: "high",
        explanation: "Transaction exceeded the compute unit limit allocated for execution.",
        likelyFix: "Reduce transaction complexity or increase compute budget limit.",
        source: "core",
        matchers: [
            {
                type: "logPattern",
                pattern: /consumed \d+ of \d+ compute units/i,
            },
            {
                type: "errorMessage",
                pattern: /compute budget exceeded/i,
            },
            {
                type: "errorMessage",
                pattern: /ComputationalBudgetExceeded/i,
            },
            {
                type: "errorCode",
                pattern: "0x1",
            },
        ],
    },
    {
        category: "missing_signer",
        confidence: "high",
        explanation: "A required signer account was not included when submitting the transaction.",
        likelyFix: "Ensure the missing account signs the transaction before sending.",
        source: "core",
        matchers: [
            {
                type: "logPattern",
                pattern: /missing required signature/i,
            },
            {
                type: "errorMessage",
                pattern: /missing required signature/i,
            },
            {
                type: "errorMessage",
                pattern: /instruction requires a signer/i,
            },
            {
                type: "errorMessage",
                pattern: /MissingRequiredSignature/i,
            },
            {
                type: "errorCode",
                pattern: "0x2",
            },
        ],
    },
    {
        category: "account_not_writable",
        confidence: "high",
        explanation: "An account that must be writable was marked as read-only or not provided.",
        likelyFix: "Ensure the account is included in the transaction with writable permission.",
        source: "core",
        matchers: [
            {
                type: "logPattern",
                pattern: /account.*not writable/i,
            },
            {
                type: "errorMessage",
                pattern: /account.*not writable/i,
            },
            {
                type: "errorMessage",
                pattern: /ReadonlyLamportChange/i,
            },
            {
                type: "errorCode",
                pattern: "0x3",
            },
        ],
    },
    {
        category: "account_not_rent_exempt",
        confidence: "high",
        explanation: "Account does not have sufficient lamports to be rent-exempt.",
        likelyFix: "Fund the account with enough lamports to meet rent-exempt minimum.",
        source: "core",
        matchers: [
            {
                type: "logPattern",
                pattern: /rent exempt/i,
            },
            {
                type: "logPattern",
                pattern: /insufficient funds for rent/i,
            },
            {
                type: "errorMessage",
                pattern: /rent exempt/i,
            },
            {
                type: "errorMessage",
                pattern: /insufficient lamports/i,
            },
            {
                type: "errorMessage",
                pattern: /InsufficientFundsForRent/i,
            },
            {
                type: "errorCode",
                pattern: "0x4",
            },
        ],
    },
    {
        category: "incorrect_pda",
        confidence: "likely",
        explanation: "Program Derived Address (PDA) seeds or program ID do not match expected derivation.",
        likelyFix: "Verify PDA derivation seeds and program ID match the program's expectations.",
        source: "core",
        matchers: [
            {
                type: "errorMessage",
                pattern: /invalid seeds/i,
            },
            {
                type: "errorMessage",
                pattern: /pda.*mismatch/i,
            },
            {
                type: "logPattern",
                pattern: /invalid seeds/i,
            },
            {
                type: "logPattern",
                pattern: /pda.*derivation/i,
            },
        ],
    },
    {
        category: "anchor_constraint_owner",
        confidence: "high",
        explanation: "Anchor constraint violation: account owner does not match expected program.",
        likelyFix: "Verify the account is owned by the correct program or initialize it properly.",
        source: "core",
        matchers: [
            {
                type: "logPattern",
                pattern: /constraint.*owner/i,
            },
            {
                type: "logPattern",
                pattern: /AnchorError.*Owner/i,
            },
            {
                type: "errorMessage",
                pattern: /constraint.*owner/i,
            },
        ],
    },
    {
        category: "anchor_constraint_seeds",
        confidence: "high",
        explanation: "Anchor constraint violation: PDA seeds do not match the constraint definition.",
        likelyFix: "Ensure PDA seeds match the account constraint seeds exactly.",
        source: "core",
        matchers: [
            {
                type: "logPattern",
                pattern: /constraint.*seeds/i,
            },
            {
                type: "logPattern",
                pattern: /AnchorError.*Seeds/i,
            },
            {
                type: "errorMessage",
                pattern: /constraint.*seeds/i,
            },
        ],
    },
    {
        category: "anchor_constraint_mut",
        confidence: "high",
        explanation: "Anchor constraint violation: account must be mutable but was marked as immutable.",
        likelyFix: "Include the account in the transaction with writable permission.",
        source: "core",
        matchers: [
            {
                type: "logPattern",
                pattern: /constraint.*mut/i,
            },
            {
                type: "logPattern",
                pattern: /AnchorError.*Mut/i,
            },
            {
                type: "errorMessage",
                pattern: /constraint.*mut/i,
            },
        ],
    },
];
const MATCHER_SCORES = {
    logPattern: 70,
    errorMessage: 40,
    errorCode: 20,
};
function scoreToConfidence(score) {
    if (score >= 50)
        return "high";
    if (score >= 30)
        return "likely";
    return "uncertain";
}
function findMatchingError(errorCode, errorMessage, logs) {
    const matcherPriority = ["logPattern", "errorMessage", "errorCode"];
    for (const mapping of exports.ERROR_MAPPINGS) {
        for (const priority of matcherPriority) {
            for (const matcher of mapping.matchers) {
                if (matcher.type !== priority)
                    continue;
                let matches = false;
                if (matcher.type === "errorCode" && errorCode) {
                    matches = errorCode === matcher.pattern;
                }
                else if (matcher.type === "errorMessage" && errorMessage) {
                    const pattern = matcher.pattern instanceof RegExp
                        ? matcher.pattern
                        : new RegExp(matcher.pattern, "i");
                    matches = pattern.test(errorMessage);
                }
                else if (matcher.type === "logPattern" && logs.length > 0) {
                    const pattern = matcher.pattern instanceof RegExp
                        ? matcher.pattern
                        : new RegExp(matcher.pattern, "i");
                    matches = logs.some((log) => pattern.test(log));
                }
                if (matches) {
                    return {
                        mapping,
                        matchedBy: matcher.type,
                        confidenceScore: MATCHER_SCORES[matcher.type],
                    };
                }
            }
        }
    }
    return null;
}
//# sourceMappingURL=errorMappings.js.map