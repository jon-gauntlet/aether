import { createClient } from '@supabase/supabase-js';
import { SystemMonitor } from '../monitoring/monitor';

export class QueryOptimizer {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        this.monitor = new SystemMonitor();
    }

    async analyzeQuery(query, params = {}) {
        try {
            const { data, error } = await this.supabase.rpc(
                'analyze_query_performance',
                { p_query: query, p_params: params }
            );

            if (error) throw error;
            return data;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'query-optimizer-analyze',
                query
            });
            throw error;
        }
    }

    async getSuggestions(query, tableName = null) {
        try {
            const { data, error } = await this.supabase.rpc(
                'suggest_query_optimization',
                { p_query: query, p_table_name: tableName }
            );

            if (error) throw error;
            return data;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'query-optimizer-suggestions',
                query,
                tableName
            });
            throw error;
        }
    }

    async optimizeQuery(query, tableName = null) {
        try {
            const [analysis, suggestions] = await Promise.all([
                this.analyzeQuery(query),
                this.getSuggestions(query, tableName)
            ]);

            const optimizationPlan = {
                originalQuery: query,
                analysis,
                suggestions: suggestions.suggestions,
                recommendedActions: this.generateRecommendations(analysis, suggestions)
            };

            // Store optimization suggestion
            await this.supabase
                .from('query_optimizations')
                .insert({
                    query_hash: this.hashQuery(query),
                    original_query: query,
                    suggested_query: optimizationPlan.recommendedActions.optimizedQuery,
                    performance_impact: optimizationPlan.recommendedActions.estimatedImpact
                });

            return optimizationPlan;
        } catch (error) {
            this.monitor.errorTracker.track(error, {
                context: 'query-optimizer-optimize',
                query,
                tableName
            });
            throw error;
        }
    }

    generateRecommendations(analysis, suggestions) {
        const recommendations = {
            optimizedQuery: suggestions.original_query,
            changes: [],
            estimatedImpact: {
                performance: 0,
                resourceUsage: 0
            }
        };

        // Apply suggestions
        suggestions.suggestions.forEach(suggestion => {
            if (!suggestion) return;

            if (suggestion.includes('SELECT *')) {
                recommendations.changes.push({
                    type: 'COLUMN_SPECIFICATION',
                    description: 'Specify needed columns',
                    impact: 'MEDIUM'
                });
                recommendations.estimatedImpact.performance += 20;
                recommendations.estimatedImpact.resourceUsage += 15;
            }

            if (suggestion.includes('trigram index')) {
                recommendations.changes.push({
                    type: 'INDEX_SUGGESTION',
                    description: 'Add trigram index for LIKE patterns',
                    impact: 'HIGH'
                });
                recommendations.estimatedImpact.performance += 40;
            }

            if (suggestion.includes('LIMIT clause')) {
                recommendations.changes.push({
                    type: 'PAGINATION',
                    description: 'Add pagination for large result sets',
                    impact: 'HIGH'
                });
                recommendations.estimatedImpact.performance += 30;
                recommendations.estimatedImpact.resourceUsage += 25;
            }
        });

        return recommendations;
    }

    hashQuery(query) {
        return Buffer.from(query).toString('base64');
    }
} 