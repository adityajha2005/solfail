"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFailureHash = exports.getAggregationManager = exports.decodeTransactionFailure = void 0;
// Library entry point - exports for use as a dependency
var decoder_1 = require("./decoder");
Object.defineProperty(exports, "decodeTransactionFailure", { enumerable: true, get: function () { return decoder_1.decodeTransactionFailure; } });
// v2: Failure Intelligence exports
var aggregation_1 = require("./aggregation");
Object.defineProperty(exports, "getAggregationManager", { enumerable: true, get: function () { return aggregation_1.getAggregationManager; } });
var fingerprint_1 = require("./fingerprint");
Object.defineProperty(exports, "generateFailureHash", { enumerable: true, get: function () { return fingerprint_1.generateFailureHash; } });
//# sourceMappingURL=lib.js.map