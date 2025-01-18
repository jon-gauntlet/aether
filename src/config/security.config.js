export const securityConfig = {
    cors: {
        allowedOrigins: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            process.env.SUPABASE_URL,
            ...(process.env.ADDITIONAL_CORS_ORIGINS || '').split(',').filter(Boolean)
        ],
        credentials: true,
        maxAge: 86400,
    },
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
    },
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                connectSrc: ["'self'", process.env.SUPABASE_URL],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"]
            }
        },
        referrerPolicy: { policy: 'same-origin' }
    }
}; 