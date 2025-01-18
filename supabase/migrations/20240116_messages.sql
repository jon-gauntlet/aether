-- Create messages table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  channel text not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table messages enable row level security;

-- Create policy for reading messages
create policy "Users can read messages in their channels"
  on messages for select
  to authenticated
  using (true);

-- Create policy for inserting messages
create policy "Users can insert messages"
  on messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table messages; 