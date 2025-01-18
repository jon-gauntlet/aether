-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create base tables
create table if not exists public.users (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own data" on public.users
    for select using (auth.uid() = id); 

-- Create health check table
create table if not exists public.health_checks (
    id uuid primary key default uuid_generate_v4(),
    count integer default 1,
    last_check timestamp with time zone default now(),
    status text default 'UP'
);

-- Insert initial health check record
insert into public.health_checks (count) values (1)
on conflict do nothing;

-- Create health check function
create or replace function update_health_check()
returns trigger as $$
begin
    new.last_check = now();
    return new;
end;
$$ language plpgsql;

-- Create health check trigger
create trigger health_check_update
    before update on health_checks
    for each row
    execute function update_health_check(); 