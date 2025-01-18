import { SystemMonitor } from '../monitoring/monitor';

const monitor = new SystemMonitor();

export const errorMiddleware = (err, req, res, next) => {
    // Track the error
    res.locals.error = err;
    
    const errorDetails = monitor.errorTracker.track(err, {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });

    // Send error response
    res.status(err.status || 500).json({
        error: {
            message: err.message,
            type: err.name,
            timestamp: errorDetails.timestamp,
            requestId: req.id // Assuming request ID middleware is used
        }
    });
}; 