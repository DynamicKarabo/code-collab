-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Rooms Table
create table if not exists rooms (
  id text primary key, -- Custom text ID like 'room-alpha' or generated string
  name text not null,
  owner_id uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Files Table
create table if not exists files (
  id uuid default uuid_generate_v4() primary key,
  room_id text references rooms(id) on delete cascade not null,
  name text not null,
  language text not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table rooms enable row level security;
alter table files enable row level security;

-- Policies for Rooms
-- Allow users to see all rooms (or restrict to own rooms if preferred, but for collab we often want shared access)
create policy "Public rooms are viewable by everyone" on rooms
  for select using (true);

create policy "Users can create their own rooms" on rooms
  for insert with check (auth.uid() = owner_id);

-- Policies for Files
create policy "Files are viewable by everyone" on files
  for select using (true);

create policy "Files can be created by authenticated users" on files
  for insert with check (auth.role() = 'authenticated');

create policy "Files can be updated by authenticated users" on files
  for update using (auth.role() = 'authenticated');

-- Policies for Deletion
create policy "Users can delete their own rooms" on rooms
  for delete using (auth.uid() = owner_id);

create policy "Users can delete files in their rooms" on files
  for delete using (
    exists (
      select 1 from rooms
      where rooms.id = files.room_id
      and rooms.owner_id = auth.uid()
    )
  );

-- Create Room Messages Table
create table if not exists room_messages (
  id uuid default uuid_generate_v4() primary key,
  room_id text references rooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  user_name text not null,
  user_color text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Policies for Room Messages
alter table room_messages enable row level security;

create policy "Room messages are viewable by everyone" on room_messages
  for select using (true);

create policy "Authenticated users can insert messages" on room_messages
  for insert with check (auth.role() = 'authenticated');
