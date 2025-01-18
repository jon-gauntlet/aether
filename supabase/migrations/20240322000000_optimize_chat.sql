-- Enable extensions for optimization
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Optimize messages table
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
    ON messages USING BRIN (created_at);

-- Add partial index for recent messages (last 24 hours)
CREATE INDEX IF NOT EXISTS idx_messages_recent 
    ON messages USING btree (created_at DESC)
    WHERE created_at > NOW() - INTERVAL '24 hours';

-- Create basic monitoring view
CREATE MATERIALIZED VIEW mv_chat_stats AS
SELECT 
    date_trunc('hour', created_at) as hour,
    count(*) as message_count,
    count(distinct user_id) as unique_users
FROM messages 
GROUP BY 1
WITH DATA;

CREATE UNIQUE INDEX idx_mv_chat_stats_hour 
    ON mv_chat_stats (hour);

-- Function to refresh stats
CREATE OR REPLACE FUNCTION refresh_chat_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_chat_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimize autovacuum for chat workload
ALTER TABLE messages SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_analyze_scale_factor = 0.05
); 