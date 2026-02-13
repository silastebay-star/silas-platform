
-- Create the 'posts' table
create table posts (
  id uuid not null primary key default gen_random_uuid(),
  content text not null,
  author_id uuid references profiles(id),
  geom geometry(Point, 4326),
  created_at timestamptz default now()
);

-- Enable RLS for the 'posts' table
alter table posts enable row level security;

-- RLS policies for 'posts' table
create policy "Posts are viewable by everyone." on posts for select using (true);
create policy "Users can insert their own posts." on posts for insert with check (auth.uid() = author_id);
