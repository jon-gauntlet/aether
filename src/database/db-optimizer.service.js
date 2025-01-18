import { createClient } from '@supabase/supabase-js';
import { SystemMonitor } from '../monitoring/monitor';

export class DatabaseOptimizer {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        this.monitor = new SystemMonitor();
    }

    async getTableStatistics() {
        try {
            const { data, error } = await this.supabase
                .from('db_statistics')
                .select('*')
                .order('collected_at', { ascending: false })
                .limit(1)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'db-optimizer-table-stats'
            });
            throw error;
        }
    }

    async getSlowQueries(threshold = 100) {
        try {
            const { data: stats } = await this.getTableStatistics();
            const slowQueries = Object.entries(stats.query_stats)
                .filter(([_, stats]) => stats.mean_exec_time > threshold)
                .map(([queryid, stats]) => ({
                    queryid,
                    mean_exec_time: stats.mean_exec_time,
                    calls: stats.calls,
                    rows_per_call: stats.rows / stats.calls,
                    query: stats.query
                }))
                .sort((a, b) => b.mean_exec_time - a.mean_exec_time);

            return slowQueries;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'db-optimizer-slow-queries'
            });
            throw error;
        }
    }

    async getUnusedIndexes() {
        try {
            const { data: stats } = await this.getTableStatistics();
            const unusedIndexes = Object.entries(stats.index_stats)
                .filter(([_, stats]) => stats.idx_scan === 0)
                .map(([index, stats]) => ({
                    index,
                    table: stats.relname,
                    size: stats.idx_size
                }));

            return unusedIndexes;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'db-optimizer-unused-indexes'
            });
            throw error;
        }
    }

    async getTableBloat() {
        try {
            const { data, error } = await this.supabase.rpc('calculate_table_bloat');
            if (error) throw error;
            return data;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'db-optimizer-table-bloat'
            });
            throw error;
        }
    }

    async getOptimizationRecommendations() {
        try {
            const [slowQueries, unusedIndexes, tableBloat] = await Promise.all([
                this.getSlowQueries(),
                this.getUnusedIndexes(),
                this.getTableBloat()
            ]);

            return {
                slowQueries: slowQueries.slice(0, 10),
                unusedIndexes,
                tableBloat,
                recommendations: this.generateRecommendations({
                    slowQueries,
                    unusedIndexes,
                    tableBloat
                })
            };
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'db-optimizer-recommendations'
            });
            throw error;
        }
    }

    generateRecommendations({ slowQueries, unusedIndexes, tableBloat }) {
        const recommendations = [];

        if (slowQueries.length > 0) {
            recommendations.push({
                type: 'QUERY_OPTIMIZATION',
                priority: 'HIGH',
                description: 'Slow queries detected that need optimization',
                details: slowQueries.slice(0, 3)
            });
        }

        if (unusedIndexes.length > 0) {
            recommendations.push({
                type: 'INDEX_CLEANUP',
                priority: 'MEDIUM',
                description: 'Unused indexes found that could be removed',
                details: unusedIndexes
            });
        }

        if (tableBloat.some(table => table.bloat_ratio > 30)) {
            recommendations.push({
                type: 'TABLE_MAINTENANCE',
                priority: 'HIGH',
                description: 'Tables with high bloat detected',
                details: tableBloat.filter(table => table.bloat_ratio > 30)
            });
        }

        return recommendations;
    }
} 