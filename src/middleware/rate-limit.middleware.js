import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import { SystemMonitor } from '../monitoring/monitor';

const monitor = new SystemMonitor();
const redis = createClient({
    url: process.env.REDIS_URL
});

redis.on('error', (error) => {
    monitor.errorTracker.track(error, { context: 'redis-rate-limit' });
});

export const createRateLimiter = ({
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = (req) => req.ip // Default to IP-based limiting
} = {}) => {
    return rateLimit({
        store: new RedisStore({
            client: redis,
            prefix: 'rate-limit:'
        }),
        windowMs,
        max,
        message,
        statusCode,
        keyGenerator,
        handler: (req, res) => {
            monitor.errorTracker.track(
                new Error('Rate limit exceeded'),
                {
                    context: 'rate-limit',
                    ip: req.ip,
                    path: req.path
                }
            );

            res.status(statusCode).json({
                success: false,
                error: {
                    message,
                    code: 'RATE_LIMIT_EXCEEDED',
                    type: 'RateLimitError'
                },
                meta: {
                    timestamp: new Date().toISOString(),
                    resetTime: new Date(Date.now() + windowMs).toISOString()
                }
            });
        }
    });
}; 