import { createClient } from '@supabase/supabase-js';
import { SystemMonitor } from '../../monitoring/monitor';

const monitor = new SystemMonitor();
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class SchemaDocumentationGenerator {
    async generateSchemaDoc() {
        try {
            const [tables, relationships, indexes, policies] = await Promise.all([
                this.getTables(),
                this.getRelationships(),
                this.getIndexes(),
                this.getPolicies()
            ]);

            return {
                tables,
                relationships,
                indexes,
                policies,
                queryPatterns: this.getQueryPatterns(),
                migrationPatterns: this.getMigrationPatterns()
            };
        } catch (error) {
            monitor.errorTracker.track(error, {
                context: 'schema-documentation-generator'
            });
            throw error;
        }
    }

    async getTables() {
        const { data, error } = await supabase.rpc('get_table_info');
        if (error) throw error;
        return data;
    }

    async getRelationships() {
        const { data, error } = await supabase.rpc('get_foreign_keys');
        if (error) throw error;
        return data;
    }

    async getIndexes() {
        const { data, error } = await supabase.rpc('get_index_info');
        if (error) throw error;
        return data;
    }

    async getPolicies() {
        const { data, error } = await supabase.rpc('get_rls_policies');
        if (error) throw error;
        return data;
    }

    getQueryPatterns() {
        return {
            common: [
                {
                    name: 'User Authentication',
                    pattern: 'SELECT * FROM auth.users WHERE email = $1',
                    description: 'Basic user lookup by email',
                    indexUsed: 'idx_users_email'
                },
                {
                    name: 'Audit Log Query',
                    pattern: 'SELECT * FROM audit_logs WHERE table_name = $1 AND changed_at > $2',
                    description: 'Query audit logs with time range',
                    indexUsed: 'idx_audit_logs_changed_at'
                }
            ],
            optimization: [
                {
                    name: 'Materialized View Refresh',
                    pattern: 'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats',
                    description: 'Refresh user statistics materialized view',
                    frequency: 'Every 15 minutes'
                }
            ],
            maintenance: [
                {
                    name: 'Table Cleanup',
                    pattern: 'DELETE FROM audit_logs WHERE changed_at < NOW() - INTERVAL \'1 year\'',
                    description: 'Remove old audit logs',
                    frequency: 'Monthly'
                }
            ]
        };
    }

    getMigrationPatterns() {
        return {
            patterns: [
                {
                    name: 'Add Column',
                    template: 'ALTER TABLE table_name ADD COLUMN column_name data_type;',
                    safetyLevel: 'Safe'
                },
                {
                    name: 'Add Index Concurrently',
                    template: 'CREATE INDEX CONCURRENTLY idx_name ON table_name (column_name);',
                    safetyLevel: 'Safe'
                },
                {
                    name: 'Change Column Type',
                    template: 'ALTER TABLE table_name ALTER COLUMN column_name TYPE new_type USING column_name::new_type;',
                    safetyLevel: 'Unsafe - Requires downtime'
                }
            ],
            bestPractices: [
                'Always use transactions for related changes',
                'Add new columns as nullable or with defaults',
                'Create indexes concurrently',
                'Use temporary tables for large data migrations'
            ],
            versioning: {
                strategy: 'Sequential numbering with timestamps',
                example: '20240101000000_add_user_fields.sql'
            }
        };
    }
} 