import { SystemMonitor } from '../monitoring/monitor';
import { QueryOptimizer } from '../database/query-optimizer.service';

export class BaseController {
    constructor() {
        this.monitor = new SystemMonitor();
        this.queryOptimizer = new QueryOptimizer();
    }

    async handleRequest(req, res, operation) {
        const startTime = process.hrtime();
        
        try {
            const result = await operation();
            
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const duration = seconds * 1000 + nanoseconds / 1000000;
            
            // Track response time
            this.monitor.performanceTracker.trackResponseTime(duration);
            
            // Send response with standard format
            return res.status(200).json({
                success: true,
                data: result,
                meta: {
                    duration: `${duration.toFixed(2)}ms`,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'api-request',
                path: req.path,
                method: req.method,
                params: req.params,
                query: req.query,
                body: req.body
            });

            return res.status(error.status || 500).json({
                success: false,
                error: {
                    message: error.message,
                    code: error.code,
                    type: error.name
                },
                meta: {
                    timestamp: new Date().toISOString()
                }
            });
        }
    }

    setPagination(req) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        return { page, limit, offset };
    }

    setOrder(req, defaultSort = 'created_at', defaultOrder = 'desc') {
        const sort = req.query.sort || defaultSort;
        const order = req.query.order || defaultOrder;

        return { sort, order };
    }

    setFilters(req, allowedFilters = []) {
        const filters = {};
        
        allowedFilters.forEach(filter => {
            if (req.query[filter] !== undefined) {
                filters[filter] = req.query[filter];
            }
        });

        return filters;
    }
} 