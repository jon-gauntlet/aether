import { SystemMonitor } from '../../monitoring/monitor';
import { PerformanceTracker } from '../../monitoring/performance-tracker';
import { RateLimiter } from './rate-limiter';
import { RequestValidator } from './request-validator';
import { ResponseFormatter } from './response-formatter';
import { CacheManager } from './cache-manager';

export class ApiManager {
    constructor() {
        this.monitor = new SystemMonitor();
        this.performanceTracker = new PerformanceTracker();
        this.rateLimiter = new RateLimiter();
        this.requestValidator = new RequestValidator();
        this.responseFormatter = new ResponseFormatter();
        this.cacheManager = new CacheManager();
    }

    async handleRequest(req, res, next) {
        const requestId = this.generateRequestId();
        const startTime = process.hrtime();

        try {
            // Track request metrics
            await this.trackRequestMetrics(req, requestId);

            // Apply rate limiting
            await this.rateLimiter.checkLimit(req);

            // Check cache
            const cachedResponse = await this.cacheManager.get(req);
            if (cachedResponse) {
                return this.sendCachedResponse(res, cachedResponse);
            }

            // Validate request
            await this.requestValidator.validate(req);

            // Add request context
            req.context = this.createRequestContext(req, requestId);

            // Continue to route handler
            next();
        } catch (error) {
            this.handleError(error, req, res, requestId);
        } finally {
            this.trackResponseMetrics(req, res, startTime, requestId);
        }
    }

    async handleResponse(req, res, data) {
        try {
            // Format response
            const formattedResponse = this.responseFormatter.format(data);

            // Cache if applicable
            await this.cacheManager.set(req, formattedResponse);

            // Send response
            return res.json(formattedResponse);
        } catch (error) {
            this.handleError(error, req, res);
        }
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async trackRequestMetrics(req, requestId) {
        const metrics = {
            method: req.method,
            path: req.path,
            query: Object.keys(req.query).length,
            headers: Object.keys(req.headers).length,
            timestamp: Date.now(),
            requestId
        };

        await this.performanceTracker.trackRequest(metrics);
    }

    createRequestContext(req, requestId) {
        return {
            requestId,
            timestamp: Date.now(),
            user: req.user,
            permissions: req.permissions,
            source: this.getRequestSource(req)
        };
    }

    getRequestSource(req) {
        return {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            referer: req.get('referer'),
            origin: req.get('origin')
        };
    }

    handleError(error, req, res, requestId) {
        this.monitor.errorTracker.track(error, {
            context: 'api-manager',
            requestId,
            path: req.path
        });

        const errorResponse = this.responseFormatter.formatError(error);
        res.status(errorResponse.status || 500).json(errorResponse);
    }

    async trackResponseMetrics(req, res, startTime, requestId) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        const metrics = {
            requestId,
            duration,
            status: res.statusCode,
            responseSize: res.get('content-length'),
            cached: res.get('x-cache') === 'HIT'
        };

        await this.performanceTracker.trackResponse(metrics);
    }

    async sendCachedResponse(res, cachedResponse) {
        res.set('x-cache', 'HIT');
        return res.json(cachedResponse);
    }
}

export class RateLimiter {
    constructor() {
        this.monitor = new SystemMonitor();
        this.store = new Map(); // Replace with Redis in production
    }

    async checkLimit(req) {
        const key = this.getKey(req);
        const limit = this.getLimit(req);
        const current = await this.getCurrentUsage(key);

        if (current >= limit) {
            throw new Error('Rate limit exceeded');
        }

        await this.incrementUsage(key);
    }

    getKey(req) {
        return req.user ? `user_${req.user.id}` : `ip_${req.ip}`;
    }

    getLimit(req) {
        return req.user ? 1000 : 100; // Per minute
    }

    async getCurrentUsage(key) {
        return this.store.get(key) || 0;
    }

    async incrementUsage(key) {
        const current = await this.getCurrentUsage(key);
        this.store.set(key, current + 1);
    }
}

export class RequestValidator {
    constructor() {
        this.monitor = new SystemMonitor();
    }

    async validate(req) {
        await Promise.all([
            this.validateHeaders(req),
            this.validateParams(req),
            this.validateBody(req)
        ]);
    }

    async validateHeaders(req) {
        const requiredHeaders = ['content-type', 'accept'];
        const missingHeaders = requiredHeaders.filter(header => !req.get(header));

        if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
        }
    }

    async validateParams(req) {
        // Implement based on route requirements
    }

    async validateBody(req) {
        // Implement based on route requirements
    }
}

export class ResponseFormatter {
    constructor() {
        this.monitor = new SystemMonitor();
    }

    format(data) {
        return {
            success: true,
            data,
            timestamp: Date.now()
        };
    }

    formatError(error) {
        return {
            success: false,
            error: {
                message: error.message,
                code: error.code || 'INTERNAL_ERROR',
                status: error.status || 500
            },
            timestamp: Date.now()
        };
    }
}

export class CacheManager {
    constructor() {
        this.monitor = new SystemMonitor();
        this.store = new Map(); // Replace with Redis in production
    }

    async get(req) {
        if (!this.isCacheable(req)) {
            return null;
        }

        const key = this.getCacheKey(req);
        return this.store.get(key);
    }

    async set(req, data) {
        if (!this.isCacheable(req)) {
            return;
        }

        const key = this.getCacheKey(req);
        this.store.set(key, data);
    }

    isCacheable(req) {
        return req.method === 'GET' && !req.headers['x-bypass-cache'];
    }

    getCacheKey(req) {
        return `${req.method}_${req.path}_${JSON.stringify(req.query)}`;
    }
} 