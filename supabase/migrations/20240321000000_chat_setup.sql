-- Create messages table
create table if not exists messages (
    id uuid default uuid_generate_v4() primary key,
    content text not null,
    created_at timestamptz default now(),
    user_id text -- Optional for now, ready for auth later
);

-- Enable realtime
alter publication supabase_realtime add table messages; 