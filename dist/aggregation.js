"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAggregationManager = getAggregationManager;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class AggregationManager {
    store = {};
    storePath;
    isDirty = false;
    saveInterval = null;
    constructor() {
        // Store aggregation data in a local file
        this.storePath = path_1.default.join(process.cwd(), '.solfail-aggregation.json');
        this.load();
        // Auto-save every 30 seconds if there are changes
        this.saveInterval = setInterval(() => {
            if (this.isDirty) {
                this.save();
            }
        }, 30000);
    }
    /**
     * Load aggregation data from disk
     */
    load() {
        try {
            if (fs_1.default.existsSync(this.storePath)) {
                const data = fs_1.default.readFileSync(this.storePath, 'utf-8');
                this.store = JSON.parse(data);
            }
        }
        catch (error) {
            console.error('Failed to load aggregation data:', error);
            this.store = {};
        }
    }
    /**
     * Save aggregation data to disk
     */
    save() {
        try {
            fs_1.default.writeFileSync(this.storePath, JSON.stringify(this.store, null, 2), 'utf-8');
            this.isDirty = false;
        }
        catch (error) {
            console.error('Failed to save aggregation data:', error);
        }
    }
    /**
     * Record a failure occurrence and return updated aggregation data
     */
    recordFailure(failureHash, failureCategory) {
        const now = new Date().toISOString();
        if (this.store[failureHash]) {
            // Update existing entry
            this.store[failureHash].seenCount += 1;
            this.store[failureHash].lastSeen = now;
        }
        else {
            // Create new entry
            this.store[failureHash] = {
                failureHash,
                failureCategory,
                firstSeen: now,
                seenCount: 1,
                lastSeen: now,
            };
        }
        this.isDirty = true;
        return this.store[failureHash];
    }
    /**
     * Get aggregation data for a specific failure hash
     */
    getAggregation(failureHash) {
        return this.store[failureHash] || null;
    }
    /**
     * Get all aggregations (useful for analytics/dashboards)
     */
    getAllAggregations() {
        return Object.values(this.store);
    }
    /**
     * Get aggregations sorted by frequency (most common failures)
     */
    getTopFailures(limit = 10) {
        return Object.values(this.store)
            .sort((a, b) => b.seenCount - a.seenCount)
            .slice(0, limit);
    }
    /**
     * Clean up resources
     */
    shutdown() {
        if (this.saveInterval) {
            clearInterval(this.saveInterval);
            this.saveInterval = null;
        }
        if (this.isDirty) {
            this.save();
        }
    }
}
// Singleton instance
let instance = null;
function getAggregationManager() {
    if (!instance) {
        instance = new AggregationManager();
    }
    return instance;
}
// Graceful shutdown handler
process.on('SIGINT', () => {
    if (instance) {
        instance.shutdown();
    }
    process.exit(0);
});
process.on('SIGTERM', () => {
    if (instance) {
        instance.shutdown();
    }
    process.exit(0);
});
//# sourceMappingURL=aggregation.js.map