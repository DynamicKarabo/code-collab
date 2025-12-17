-- Create Profiles Table
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_color text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);

create policy "Users can insert their own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);

-- Function to handle new user signup (optional, but good practice)
-- triggers when a user signs up via Supabase Auth
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_color)
  values (new.id, new.raw_user_meta_data->>'full_name', '#3b82f6'); -- Default blue color
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
