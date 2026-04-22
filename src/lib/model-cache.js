// Simple in-memory cache for model configurations
// Reduces database load for frequently accessed models

class ModelCache {
    constructor() {
        this.cache = new Map();
        this.ttl = 5 * 60 * 1000; // 5 minutes TTL
    }

    set(modelId, data) {
        this.cache.set(modelId, {
            data,
            timestamp: Date.now()
        });
    }

    get(modelId) {
        const cached = this.cache.get(modelId);
        
        if (!cached) {
            return null;
        }

        // Check if expired
        if (Date.now() - cached.timestamp > this.ttl) {
            this.cache.delete(modelId);
            return null;
        }

        return cached.data;
    }

    invalidate(modelId) {
        if (modelId) {
            this.cache.delete(modelId);
        } else {
            // Clear all cache
            this.cache.clear();
        }
    }

    // Auto cleanup expired entries every 10 minutes
    startCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > this.ttl) {
                    this.cache.delete(key);
                }
            }
        }, 10 * 60 * 1000);
    }

    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
}

// Singleton instance
const modelCache = new ModelCache();
modelCache.startCleanup();

export default modelCache;
