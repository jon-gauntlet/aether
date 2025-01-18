-- Create materialized views for common queries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_stats AS
SELECT 
    u.id,
    u.email,
    COUNT(al.id) as audit_count,
    MAX(al.changed_at) as last_activity
FROM public.users u
LEFT JOIN public.audit_logs al ON al.changed_by = u.id
GROUP BY u.id, u.email
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_stats_id ON mv_user_stats (id);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule materialized view refresh
SELECT cron.schedule(
    'refresh_mv_stats',
    '*/15 * * * *',  -- Every 15 minutes
    'SELECT refresh_materialized_views()'
);

-- Create functions for query analysis
CREATE OR REPLACE FUNCTION analyze_query_performance(
    p_query text,
    p_params jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb AS $$
DECLARE
    v_plan jsonb;
    v_execution jsonb;
    v_analysis jsonb;
BEGIN
    -- Get query plan
    EXECUTE 'EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS) ' || p_query INTO v_plan;
    
    -- Analyze the plan
    SELECT jsonb_build_object(
        'total_cost', plan->0->>'Total Cost',
        'actual_time', plan->0->>'Actual Time',
        'planning_time', plan->0->>'Planning Time',
        'execution_time', plan->0->>'Execution Time',
        'buffers_hit', plan->0->>'Shared Buffers Hit',
        'buffers_read', plan->0->>'Shared Buffers Read',
        'rows_processed', plan->0->>'Actual Rows',
        'optimization_opportunities', jsonb_build_array(
            CASE WHEN plan->0->>'Node Type' = 'Seq Scan' 
                 THEN 'Consider adding an index to avoid sequential scan'
                 ELSE NULL END,
            CASE WHEN (plan->0->>'Actual Rows')::int > 1000 
                 THEN 'Consider pagination or limiting result set'
                 ELSE NULL END
        )
    ) INTO v_analysis
    FROM jsonb_array_elements(v_plan) plan;

    RETURN v_analysis;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create query optimization suggestions table
CREATE TABLE IF NOT EXISTS public.query_optimizations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash text NOT NULL,
    original_query text NOT NULL,
    suggested_query text,
    performance_impact jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    applied_at timestamptz,
    success_metric jsonb
);

CREATE INDEX IF NOT EXISTS idx_query_optimizations_hash 
    ON public.query_optimizations (query_hash);

-- Function to suggest query optimizations
CREATE OR REPLACE FUNCTION suggest_query_optimization(
    p_query text,
    p_table_name text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
    v_suggestion jsonb;
    v_table_stats jsonb;
BEGIN
    -- Get table statistics if table name provided
    IF p_table_name IS NOT NULL THEN
        SELECT row_to_json(stats)::jsonb INTO v_table_stats
        FROM pg_stat_user_tables stats
        WHERE schemaname = 'public' AND relname = p_table_name;
    END IF;

    -- Build optimization suggestions
    SELECT jsonb_build_object(
        'original_query', p_query,
        'suggestions', jsonb_build_array(
            CASE WHEN p_query ~* 'select \*'
                 THEN 'Specify needed columns instead of SELECT *'
                 ELSE NULL END,
            CASE WHEN p_query ~* 'like.*%.*%'
                 THEN 'Consider using trigram index for LIKE patterns'
                 ELSE NULL END,
            CASE WHEN v_table_stats IS NOT NULL AND 
                      (v_table_stats->>'n_live_tup')::int > 10000 AND
                      p_query !~* 'limit'
                 THEN 'Add LIMIT clause for large tables'
                 ELSE NULL END
        ),
        'table_stats', v_table_stats
    ) INTO v_suggestion;

    RETURN v_suggestion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 