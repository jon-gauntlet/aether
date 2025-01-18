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

-- Create health check policy
create policy "Allow health check" 
  on messages for select 
  using (true); 