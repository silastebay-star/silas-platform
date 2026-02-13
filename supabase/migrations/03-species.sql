
-- Create the 'species' table
create table species (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Enable RLS for the 'species' table
alter table species enable row level security;

-- RLS policies for 'species' table
create policy "Species are viewable by everyone." on species for select using (true);
create policy "Users can insert species." on species for insert with check (auth.uid() = author_id);
