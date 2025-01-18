-- Create messages table
create table messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
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