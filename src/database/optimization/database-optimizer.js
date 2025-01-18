import { SystemMonitor } from '../../monitoring/monitor';
import { PerformanceTracker } from '../../monitoring/performance-tracker';
import { pool } from '../connection';

export class DatabaseOptimizer {
    constructor() {
        this.monitor = new SystemMonitor();
        this.performanceTracker = new PerformanceTracker();
    }

    async analyzeAndOptimize() {
        try {
            const [
                tableStats,
                indexStats,
                queryStats,
                vacuumStats
            ] = await Promise.all([
                this.analyzeTableStatistics(),
                this.analyzeIndexUsage(),
                this.analyzeQueryPerformance(),
                this.analyzeVacuumNeeds()
            ]);

            const optimizationPlan = this.generateOptimizationPlan({
                tableStats,
                indexStats,
                queryStats,
                vacuumStats
            });

            return {
                statistics: {
                    tableStats,
                    indexStats,
                    queryStats,
                    vacuumStats
                },
                optimizationPlan,
                recommendations: this.generateRecommendations(optimizationPlan)
            };
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'database-optimizer'
            });
            throw error;
        }
    }

    async analyzeTableStatistics() {
        const query = `
            SELECT
                schemaname,
                relname as table_name,
                n_live_tup as row_count,
                n_dead_tup as dead_rows,
                last_vacuum,
                last_analyze,
                pg_total_relation_size(relid) as total_size,
                pg_table_size(relid) as table_size,
                pg_indexes_size(relid) as index_size
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC;
        `;

        try {
            const result = await pool.query(query);
            return result.rows.map(row => ({
                ...row,
                bloat_ratio: (row.dead_rows / (row.row_count + 1)) * 100,
                needs_vacuum: this.needsVacuum(row),
                needs_analyze: this.needsAnalyze(row)
            }));
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'table-statistics-analysis'
            });
            throw error;
        }
    }

    async analyzeIndexUsage() {
        const query = `
            SELECT
                schemaname,
                relname as table_name,
                indexrelname as index_name,
                idx_scan,
                idx_tup_read,
                idx_tup_fetch,
                pg_relation_size(indexrelid) as index_size
            FROM pg_stat_user_indexes
            ORDER BY idx_scan DESC;
        `;

        try {
            const result = await pool.query(query);
            return result.rows.map(row => ({
                ...row,
                usage_ratio: row.idx_scan / (row.idx_tup_read + 1),
                efficiency: this.calculateIndexEfficiency(row),
                recommendation: this.getIndexRecommendation(row)
            }));
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'index-usage-analysis'
            });
            throw error;
        }
    }

    async analyzeQueryPerformance() {
        const query = `
            SELECT
                queryid,
                query,
                calls,
                total_time,
                mean_time,
                rows,
                shared_blks_hit,
                shared_blks_read,
                shared_blks_written,
                shared_blks_dirtied,
                temp_blks_read,
                temp_blks_written
            FROM pg_stat_statements
            ORDER BY total_time DESC
            LIMIT 100;
        `;

        try {
            const result = await pool.query(query);
            return result.rows.map(row => ({
                ...row,
                avg_time_per_row: row.mean_time / (row.rows || 1),
                cache_hit_ratio: row.shared_blks_hit / (row.shared_blks_hit + row.shared_blks_read),
                optimization_score: this.calculateQueryOptimizationScore(row)
            }));
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'query-performance-analysis'
            });
            throw error;
        }
    }

    async analyzeVacuumNeeds() {
        const query = `
            SELECT
                schemaname,
                relname as table_name,
                n_dead_tup,
                n_live_tup,
                last_vacuum,
                last_autovacuum,
                vacuum_count,
                autovacuum_count
            FROM pg_stat_user_tables
            WHERE n_dead_tup > 0
            ORDER BY n_dead_tup DESC;
        `;

        try {
            const result = await pool.query(query);
            return result.rows.map(row => ({
                ...row,
                dead_ratio: (row.n_dead_tup / (row.n_live_tup + 1)) * 100,
                vacuum_effectiveness: this.calculateVacuumEffectiveness(row),
                recommendation: this.getVacuumRecommendation(row)
            }));
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'vacuum-needs-analysis'
            });
            throw error;
        }
    }

    generateOptimizationPlan({ tableStats, indexStats, queryStats, vacuumStats }) {
        return {
            immediate: {
                vacuum: this.getImmediateVacuumTasks(vacuumStats),
                indexes: this.getImmediateIndexTasks(indexStats),
                queries: this.getImmediateQueryOptimizations(queryStats)
            },
            short_term: {
                tables: this.getShortTermTableOptimizations(tableStats),
                indexes: this.getShortTermIndexOptimizations(indexStats),
                queries: this.getShortTermQueryOptimizations(queryStats)
            },
            long_term: {
                partitioning: this.getPartitioningRecommendations(tableStats),
                archival: this.getArchivalRecommendations(tableStats),
                restructuring: this.getRestructuringRecommendations({
                    tableStats,
                    queryStats
                })
            }
        };
    }

    generateRecommendations(optimizationPlan) {
        return {
            critical: this.getCriticalRecommendations(optimizationPlan),
            performance: this.getPerformanceRecommendations(optimizationPlan),
            maintenance: this.getMaintenanceRecommendations(optimizationPlan),
            monitoring: this.getMonitoringRecommendations(optimizationPlan)
        };
    }

    // Helper methods
    needsVacuum(tableStats) {
        return tableStats.dead_rows > 1000 || 
               (tableStats.dead_rows / (tableStats.row_count + 1)) > 0.2;
    }

    needsAnalyze(tableStats) {
        const lastAnalyze = new Date(tableStats.last_analyze);
        const daysSinceAnalyze = (Date.now() - lastAnalyze) / (1000 * 60 * 60 * 24);
        return daysSinceAnalyze > 7 || tableStats.row_count > 100000;
    }

    calculateIndexEfficiency(indexStats) {
        return {
            scan_efficiency: indexStats.idx_tup_fetch / (indexStats.idx_tup_read + 1),
            size_efficiency: indexStats.idx_tup_fetch / (indexStats.index_size + 1),
            overall_score: this.calculateOverallIndexScore(indexStats)
        };
    }

    calculateQueryOptimizationScore(queryStats) {
        const timeScore = 1 / (queryStats.mean_time + 1);
        const cacheScore = queryStats.shared_blks_hit / (queryStats.shared_blks_hit + queryStats.shared_blks_read);
        const rowScore = Math.min(1, queryStats.rows / 1000);
        
        return (timeScore + cacheScore + rowScore) / 3;
    }

    calculateVacuumEffectiveness(vacuumStats) {
        return {
            dead_tuple_ratio: vacuumStats.n_dead_tup / (vacuumStats.n_live_tup + 1),
            vacuum_frequency: vacuumStats.vacuum_count / (vacuumStats.autovacuum_count + 1),
            last_vacuum_age: this.calculateDaysSince(vacuumStats.last_vacuum)
        };
    }

    calculateDaysSince(date) {
        return date ? (Date.now() - new Date(date)) / (1000 * 60 * 60 * 24) : null;
    }

    calculateOverallIndexScore(indexStats) {
        const scanScore = indexStats.idx_scan / 1000;
        const sizeScore = 1 / (indexStats.index_size / (1024 * 1024) + 1);
        const efficiencyScore = indexStats.idx_tup_fetch / (indexStats.idx_tup_read + 1);
        
        return (scanScore + sizeScore + efficiencyScore) / 3;
    }
} 