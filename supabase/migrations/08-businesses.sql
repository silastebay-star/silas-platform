
-- Create the 'businesses' table
create table businesses (
  id uuid not null primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  address text,
  contact_info jsonb,
  geom geometry(Point, 4326),
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Enable RLS for the 'businesses' table
alter table businesses enable row level security;

-- RLS policies for 'businesses' table
create policy "Businesses are viewable by everyone." on businesses for select using (true);
create policy "Users can insert their own businesses." on businesses for insert with check (auth.uid() = author_id);
