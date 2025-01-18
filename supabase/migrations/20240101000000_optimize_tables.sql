-- Enable necessary extensions for optimization
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Optimize users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users USING btree (created_at);

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    operation text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    changed_by uuid REFERENCES public.users(id),
    changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_at ON public.audit_logs USING brin (changed_at);

-- Create function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (
            table_name,
            record_id,
            operation,
            new_data,
            changed_by
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            TG_OP,
            to_jsonb(NEW),
            auth.uid()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (
            table_name,
            record_id,
            operation,
            old_data,
            new_data,
            changed_by
        ) VALUES (
            TG_TABLE_NAME,
            NEW.id,
            TG_OP,
            to_jsonb(OLD),
            to_jsonb(NEW),
            auth.uid()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (
            table_name,
            record_id,
            operation,
            old_data,
            changed_by
        ) VALUES (
            TG_TABLE_NAME,
            OLD.id,
            TG_OP,
            to_jsonb(OLD),
            auth.uid()
        );
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to users table
DROP TRIGGER IF EXISTS audit_users_changes ON public.users;
CREATE TRIGGER audit_users_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_log_changes();

-- Create table for database statistics
CREATE TABLE IF NOT EXISTS public.db_statistics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    collected_at timestamptz NOT NULL DEFAULT now(),
    table_stats jsonb NOT NULL,
    index_stats jsonb NOT NULL,
    query_stats jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_db_statistics_collected_at 
    ON public.db_statistics USING brin (collected_at);

-- Function to collect database statistics
CREATE OR REPLACE FUNCTION collect_db_statistics()
RETURNS void AS $$
BEGIN
    INSERT INTO public.db_statistics (table_stats, index_stats, query_stats)
    SELECT
        (SELECT jsonb_object_agg(schemaname || '.' || relname, row_to_json(stats))
         FROM pg_stat_user_tables stats)::jsonb AS table_stats,
        (SELECT jsonb_object_agg(schemaname || '.' || relname, row_to_json(stats))
         FROM pg_stat_user_indexes stats)::jsonb AS index_stats,
        (SELECT jsonb_object_agg(queryid::text, row_to_json(stats))
         FROM pg_stat_statements stats)::jsonb AS query_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to collect statistics
SELECT cron.schedule(
    'collect_db_stats',
    '0 * * * *',  -- Every hour
    'SELECT collect_db_statistics()'
);

-- Optimize vacuum settings for better performance
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;
ALTER SYSTEM SET autovacuum_vacuum_cost_delay = 2;
ALTER SYSTEM SET maintenance_work_mem = '256MB'; 