import { TracingManager } from '../tracing/tracing-manager';

const tracingManager = new TracingManager();

export const tracingMiddleware = async (req, res, next) => {
    const context = {
        tags: {
            http_method: req.method,
            http_url: req.originalUrl,
            http_host: req.get('host'),
            user_agent: req.get('user-agent')
        }
    };

    const span = await tracingManager.startSpan('http_request', context);
    if (span) {
        req.tracing = span;

        // Capture response
        const originalEnd = res.end;
        res.end = async function(...args) {
            await span.setTag('http_status_code', res.statusCode);
            await span.end();
            originalEnd.apply(this, args);
        };
    }

    next();
}; 