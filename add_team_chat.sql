-- Create Room Messages Table
create table if not exists room_messages (
  id uuid default uuid_generate_v4() primary key,
  room_id text references rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  user_name text not null, -- Store name for easy display
  user_color text not null, -- Store color for easy display
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Room Messages
alter table room_messages enable row level security;

create policy "Room messages are viewable by everyone" on room_messages
  for select using (true);

create policy "Authenticated users can insert messages" on room_messages
  for insert with check (auth.role() = 'authenticated');
