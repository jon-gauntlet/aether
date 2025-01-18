create table messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  username text not null,
  channel text not null,
  timestamp timestamptz default now(),
  user_id uuid references auth.users(id)
);

-- Enable row level security
alter table messages enable row level security;

-- Allow anyone to read messages
create policy "Anyone can read messages"
  on messages for select
  using (true);

-- Allow authenticated users to insert messages
create policy "Authenticated users can insert messages"
  on messages for insert
  with check (auth.role() = 'authenticated'); 