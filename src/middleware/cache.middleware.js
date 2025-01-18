import { CacheManager } from '../cache/cache-manager';

const cacheManager = new CacheManager();

export const cacheMiddleware = async (req, res, next) => {
    try {
        // Check for cached response
        const cached = await cacheManager.getResponse(req);
        
        if (cached) {
            // Set cached headers
            Object.entries(cached.headers).forEach(([key, value]) => {
                res.set(key, value);
            });
            
            // Send cached response
            return res.status(cached.status).json(cached.data);
        }

        // Cache the response
        const originalJson = res.json;
        res.json = function(data) {
            cacheManager.cacheResponse(req, res, data);
            return originalJson.call(this, data);
        };

        next();
    } catch (error) {
        next(error);
    }
}; 