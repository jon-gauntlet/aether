import { createClient } from '@supabase/supabase-js';
import { SystemMonitor } from '../monitoring/monitor';

const monitor = new SystemMonitor();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

export class HealthController {
    static async check(req, res) {
        try {
            const supabaseStatus = await checkSupabaseConnection();
            
            // Enhanced health metrics
            const health = {
                status: supabaseStatus.status === 'UP' ? 'UP' : 'DEGRADED',
                timestamp: new Date(),
                components: {
                    supabase: supabaseStatus,
                    api: {
                        status: 'UP',
                        metrics: monitor.getMetrics()
                    }
                },
                uptime: process.uptime(),
                memory: process.memoryUsage()
            };
            
            res.status(health.status === 'UP' ? 200 : 207).json(health);
        } catch (error) {
            res.status(503).json({
                status: 'DOWN',
                timestamp: new Date(),
                error: error.message
            });
        }
    }
}

async function checkSupabaseConnection() {
    const startTime = performance.now();
    try {
        // Perform a simple query to check connection
        const { data, error } = await supabase
            .from('health_checks')
            .select('count')
            .single();

        if (error) throw error;

        const latency = performance.now() - startTime;
        
        return { 
            status: 'UP',
            latency: Math.round(latency),
            lastChecked: new Date(),
            details: {
                responseTime: `${latency.toFixed(2)}ms`,
                connection: 'active',
                query: 'successful'
            }
        };
    } catch (error) {
        return { 
            status: 'DOWN', 
            error: error.message,
            lastChecked: new Date(),
            details: {
                errorType: error.code || 'UNKNOWN',
                connection: 'failed'
            }
        };
    }
} 