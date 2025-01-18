import pino from 'pino';
import { performance } from 'perf_hooks';

export class ErrorTracker {
    constructor() {
        this.logger = pino({
            level: process.env.LOG_LEVEL || 'error',
            timestamp: () => `,"time":"${new Date().toISOString()}"`,
            transport: {
                target: 'pino/file',
                options: { destination: './logs/error.log' }
            }
        });

        this.errorMetrics = {
            counts: new Map(),
            lastErrors: [],
            startTime: Date.now()
        };
    }

    track(error, context = {}) {
        const errorKey = this.getErrorKey(error);
        const currentCount = this.errorMetrics.counts.get(errorKey) || 0;
        this.errorMetrics.counts.set(errorKey, currentCount + 1);

        const errorEntry = {
            timestamp: new Date(),
            type: error.name,
            message: error.message,
            stack: error.stack,
            context,
            count: currentCount + 1
        };

        // Keep last 100 errors
        this.errorMetrics.lastErrors.unshift(errorEntry);
        if (this.errorMetrics.lastErrors.length > 100) {
            this.errorMetrics.lastErrors.pop();
        }

        this.logger.error({
            ...errorEntry,
            context: {
                ...context,
                performance: {
                    memory: process.memoryUsage(),
                    uptime: process.uptime()
                }
            }
        });

        return errorEntry;
    }

    getErrorKey(error) {
        return `${error.name}:${error.message}`;
    }

    getMetrics() {
        const errorCounts = Object.fromEntries(this.errorMetrics.counts);
        const errorRate = Array.from(this.errorMetrics.counts.values())
            .reduce((a, b) => a + b, 0) / 
            ((Date.now() - this.errorMetrics.startTime) / 1000);

        return {
            errorCounts,
            errorRate: errorRate.toFixed(4),
            recentErrors: this.errorMetrics.lastErrors.slice(0, 10),
            totalErrors: this.errorMetrics.lastErrors.length
        };
    }

    clearMetrics() {
        this.errorMetrics.counts.clear();
        this.errorMetrics.lastErrors = [];
        this.errorMetrics.startTime = Date.now();
    }
} 