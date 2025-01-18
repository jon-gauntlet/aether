-- Create messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  user_id text
);

-- Add index for faster message retrieval
create index messages_created_at_idx on messages (created_at desc);

-- Enable row level security
alter table messages enable row level security;

-- Create policy to allow all operations for now
create policy "Allow all operations" on messages
  for all using (true);

-- Enable realtime
alter publication supabase_realtime add table messages;

-- Create health check function
create or replace function check_health()
returns jsonb
language plpgsql
security definer
as $$
begin
  return jsonb_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'version', current_setting('server_version')
  );
end;
$$;

-- Create verification helper functions
create or replace function check_index_exists(index_name text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from pg_indexes 
    where indexname = index_name
  );
end;
$$;

create or replace function check_rls_enabled(table_name text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from pg_tables
    where tablename = table_name
    and rowsecurity = true
  );
end;
$$;

-- Create complete verification function
create or replace function verify_complete_setup()
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  result = jsonb_build_object(
    'table_exists', (select exists(select 1 from pg_tables where tablename = 'messages')),
    'index_exists', check_index_exists('messages_created_at_idx'),
    'rls_enabled', check_rls_enabled('messages'),
    'realtime_enabled', (select exists(select 1 from pg_publication_tables where tablename = 'messages')),
    'health_check', (select check_health()),
    'policies', (
      select jsonb_agg(polname)
      from pg_policy
      where tablename = 'messages'
    )
  );

  if not (
    (result->>'table_exists')::boolean and
    (result->>'index_exists')::boolean and
    (result->>'rls_enabled')::boolean and
    (result->>'realtime_enabled')::boolean and
    jsonb_array_length(result->'policies') > 0
  ) then
    raise exception 'Incomplete database setup: %', result;
  end if;

  return result;
end;
$$; 