import { LoggingManager } from '../logging/logging-manager';

const loggingManager = new LoggingManager();

export const loggingMiddleware = async (req, res, next) => {
    const startTime = process.hrtime();

    // Log request
    await loggingManager.info('Incoming request', {
        method: req.method,
        path: req.path,
        query: req.query,
        headers: req.headers,
        requestId: req.context?.requestId
    });

    // Capture response
    const originalEnd = res.end;
    res.end = function(...args) {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1000000;

        // Log response
        loggingManager.info('Request completed', {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            requestId: req.context?.requestId
        });

        originalEnd.apply(this, args);
    };

    next();
}; 