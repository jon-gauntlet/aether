-- Function to get detailed table information
CREATE OR REPLACE FUNCTION get_table_info()
RETURNS TABLE (
    table_name text,
    column_name text,
    data_type text,
    is_nullable boolean,
    column_default text,
    description text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.table_name::text,
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::boolean,
        c.column_default::text,
        pd.description::text
    FROM information_schema.columns c
    LEFT JOIN pg_description pd ON 
        pd.objoid = (c.table_schema || '.' || c.table_name)::regclass AND
        pd.objsubid = c.ordinal_position
    WHERE c.table_schema = 'public'
    ORDER BY c.table_name, c.ordinal_position;
END;
$$;

-- Function to get foreign key relationships
CREATE OR REPLACE FUNCTION get_foreign_keys()
RETURNS TABLE (
    table_name text,
    column_name text,
    foreign_table_name text,
    foreign_column_name text,
    update_rule text,
    delete_rule text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.table_name::text,
        kcu.column_name::text,
        ccu.table_name::text AS foreign_table_name,
        ccu.column_name::text AS foreign_column_name,
        rc.update_rule::text,
        rc.delete_rule::text
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
END;
$$;

-- Function to get index information
CREATE OR REPLACE FUNCTION get_index_info()
RETURNS TABLE (
    table_name text,
    index_name text,
    index_type text,
    is_unique boolean,
    indexed_columns text[],
    index_size bigint,
    index_usage bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || tablename::text AS table_name,
        indexname::text AS index_name,
        indexdef::text AS index_type,
        idx.indisunique AS is_unique,
        array_agg(a.attname)::text[] AS indexed_columns,
        pg_relation_size(indexrelid) AS index_size,
        idx_scan AS index_usage
    FROM pg_stat_user_indexes ui
    JOIN pg_index idx ON ui.indexrelid = idx.indexrelid
    JOIN pg_attribute a ON a.attrelid = ui.indexrelid
    WHERE schemaname = 'public'
    GROUP BY 1, 2, 3, 4, indexrelid, idx_scan;
END;
$$;

-- Function to get RLS policies
CREATE OR REPLACE FUNCTION get_rls_policies()
RETURNS TABLE (
    table_name text,
    policy_name text,
    policy_action text,
    policy_roles text[],
    policy_using text,
    policy_with_check text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        schemaname || '.' || tablename::text AS table_name,
        polname::text AS policy_name,
        polcmd::text AS policy_action,
        polroles::text[] AS policy_roles,
        pg_get_expr(polqual, polrelid)::text AS policy_using,
        pg_get_expr(polwithcheck, polrelid)::text AS policy_with_check
    FROM pg_policy
    JOIN pg_class pc ON pc.oid = polrelid
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public';
END;
$$; 