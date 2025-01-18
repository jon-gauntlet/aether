import { SystemMonitor } from '../monitoring/monitor';
import { PerformanceTracker } from '../monitoring/performance-tracker';
import { DataCache } from './data-cache';
import { ResponseCache } from './response-cache';
import { CachePolicy } from './cache-policy';
import { CacheStats } from './cache-stats';

export class CacheManager {
    constructor() {
        this.monitor = new SystemMonitor();
        this.performanceTracker = new PerformanceTracker();
        this.dataCache = new DataCache();
        this.responseCache = new ResponseCache();
        this.cachePolicy = new CachePolicy();
        this.cacheStats = new CacheStats();
    }

    async get(key, options = {}) {
        const startTime = process.hrtime();
        const cacheId = this.generateCacheId();

        try {
            // Check cache policy
            if (!this.cachePolicy.shouldCache(key, options)) {
                return null;
            }

            // Get from cache
            const cached = await this.dataCache.get(key);
            
            // Track metrics
            await this.trackCacheMetrics('get', key, !!cached, startTime, cacheId);

            return cached;
        } catch (error) {
            await this.handleCacheError(error, 'get', key, cacheId);
            return null;
        }
    }

    async set(key, value, options = {}) {
        const startTime = process.hrtime();
        const cacheId = this.generateCacheId();

        try {
            // Check cache policy
            if (!this.cachePolicy.shouldCache(key, options)) {
                return false;
            }

            // Set in cache
            await this.dataCache.set(key, value, options);
            
            // Track metrics
            await this.trackCacheMetrics('set', key, true, startTime, cacheId);

            return true;
        } catch (error) {
            await this.handleCacheError(error, 'set', key, cacheId);
            return false;
        }
    }

    async cacheResponse(req, res, data, options = {}) {
        const key = this.generateResponseCacheKey(req);
        const startTime = process.hrtime();
        const cacheId = this.generateCacheId();

        try {
            // Check if response should be cached
            if (!this.cachePolicy.shouldCacheResponse(req, options)) {
                return false;
            }

            // Cache response
            await this.responseCache.set(key, {
                data,
                headers: res.getHeaders(),
                status: res.statusCode
            }, options);

            // Track metrics
            await this.trackCacheMetrics('response', key, true, startTime, cacheId);

            return true;
        } catch (error) {
            await this.handleCacheError(error, 'response', key, cacheId);
            return false;
        }
    }

    async getResponse(req) {
        const key = this.generateResponseCacheKey(req);
        const startTime = process.hrtime();
        const cacheId = this.generateCacheId();

        try {
            // Check if response should be served from cache
            if (!this.cachePolicy.shouldServeFromCache(req)) {
                return null;
            }

            // Get from cache
            const cached = await this.responseCache.get(key);
            
            // Track metrics
            await this.trackCacheMetrics('response_get', key, !!cached, startTime, cacheId);

            return cached;
        } catch (error) {
            await this.handleCacheError(error, 'response_get', key, cacheId);
            return null;
        }
    }

    generateResponseCacheKey(req) {
        return `${req.method}:${req.originalUrl}:${JSON.stringify(req.body)}`;
    }

    generateCacheId() {
        return `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async handleCacheError(error, operation, key, cacheId) {
        await this.monitor.errorTracker.track(error, {
            context: 'cache-manager',
            operation,
            key,
            cacheId
        });
    }

    async trackCacheMetrics(operation, key, hit, startTime, cacheId) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        const metrics = {
            operation,
            key,
            hit,
            duration,
            cacheId,
            timestamp: Date.now()
        };

        await this.performanceTracker.trackCache(metrics);
        await this.cacheStats.record(metrics);
    }
}

export class DataCache {
    constructor() {
        this.monitor = new SystemMonitor();
        this.store = new Map(); // Replace with Redis in production
    }

    async get(key) {
        const item = this.store.get(key);
        
        if (!item) {
            return null;
        }

        if (this.isExpired(item)) {
            this.store.delete(key);
            return null;
        }

        return item.value;
    }

    async set(key, value, options = {}) {
        this.store.set(key, {
            value,
            expires: options.ttl ? Date.now() + options.ttl : null
        });
    }

    isExpired(item) {
        return item.expires && Date.now() > item.expires;
    }
}

export class ResponseCache {
    constructor() {
        this.monitor = new SystemMonitor();
        this.store = new Map(); // Replace with Redis in production
    }

    async get(key) {
        const item = this.store.get(key);
        
        if (!item || this.isExpired(item)) {
            this.store.delete(key);
            return null;
        }

        return item.value;
    }

    async set(key, value, options = {}) {
        this.store.set(key, {
            value,
            expires: options.ttl ? Date.now() + options.ttl : null
        });
    }

    isExpired(item) {
        return item.expires && Date.now() > item.expires;
    }
}

export class CachePolicy {
    constructor() {
        this.monitor = new SystemMonitor();
        this.policies = new Map();
    }

    shouldCache(key, options = {}) {
        // Check if key matches any no-cache patterns
        if (this.matchesNoCachePattern(key)) {
            return false;
        }

        // Check if value size exceeds limits
        if (options.size && options.size > this.getMaxSize()) {
            return false;
        }

        return true;
    }

    shouldCacheResponse(req, options = {}) {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return false;
        }

        // Don't cache authenticated requests
        if (req.user) {
            return false;
        }

        // Don't cache if client sends no-cache
        if (req.get('Cache-Control') === 'no-cache') {
            return false;
        }

        return true;
    }

    shouldServeFromCache(req) {
        // Don't serve from cache if client sends no-cache
        if (req.get('Cache-Control') === 'no-cache') {
            return false;
        }

        return true;
    }

    matchesNoCachePattern(key) {
        const noCachePatterns = [
            /^temp:/,
            /^session:/
        ];

        return noCachePatterns.some(pattern => pattern.test(key));
    }

    getMaxSize() {
        return 1024 * 1024; // 1MB
    }
}

export class CacheStats {
    constructor() {
        this.monitor = new SystemMonitor();
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            errors: 0
        };
    }

    async record(metrics) {
        if (metrics.operation === 'get' || metrics.operation === 'response_get') {
            metrics.hit ? this.stats.hits++ : this.stats.misses++;
        } else if (metrics.operation === 'set' || metrics.operation === 'response') {
            this.stats.sets++;
        }

        await this.monitor.metricsTracker.track('cache', this.stats);
    }

    getStats() {
        return {
            ...this.stats,
            hitRate: this.stats.hits / (this.stats.hits + this.stats.misses)
        };
    }
} 