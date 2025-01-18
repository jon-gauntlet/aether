import { createClient } from '@supabase/supabase-js';
import { SystemMonitor } from '../monitoring/monitor';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const monitor = new SystemMonitor();

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new Error('No token provided');
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
            throw error;
        }

        req.user = user;
        next();
    } catch (error) {
        monitor.errorTracker.track(error, {
            context: 'auth-middleware',
            headers: req.headers
        });
        
        res.status(401).json({
            error: 'Unauthorized',
            message: error.message
        });
    }
}; 