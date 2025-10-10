
-- Create the 'residents' table
create table residents (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  address text,
  contact_info jsonb,
  profile_id uuid references profiles(id) unique,
  created_at timestamptz default now()
);

-- Enable RLS for the 'residents' table
alter table residents enable row level security;

-- RLS policies for 'residents' table
create policy "Residents can view their own data." on residents for select using (auth.uid() = profile_id);
create policy "Users can insert their own resident data." on residents for insert with check (auth.uid() = profile_id);
create policy "Users can update their own resident data." on residents for update using (auth.uid() = profile_id);
