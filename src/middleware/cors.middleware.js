import cors from 'cors';
import { SystemMonitor } from '../monitoring/monitor';

const monitor = new SystemMonitor();

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) {
            return callback(null, true);
        }

        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            process.env.SUPABASE_URL,
            // Add other allowed origins from environment
            ...(process.env.ADDITIONAL_CORS_ORIGINS || '').split(',').filter(Boolean)
        ];

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            monitor.errorTracker.track(
                new Error('CORS origin rejected'), 
                { context: 'cors-middleware', origin }
            );
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Authorization',
        'Content-Type',
        'Origin',
        'Accept',
        'X-Requested-With',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
};

// Create a monitoring-enabled CORS middleware
export const corsMiddleware = () => {
    const middleware = cors(corsOptions);
    
    return (req, res, next) => {
        const startTime = process.hrtime();
        
        middleware(req, res, (err) => {
            if (err) {
                monitor.errorTracker.track(err, {
                    context: 'cors-middleware',
                    origin: req.headers.origin,
                    method: req.method
                });
                return res.status(403).json({
                    error: 'CORS Error',
                    message: err.message
                });
            }

            const [seconds, nanoseconds] = process.hrtime(startTime);
            const duration = seconds * 1000 + nanoseconds / 1000000;
            
            monitor.performanceTracker.trackResponseTime(duration);
            next();
        });
    };
}; 