
-- Create the 'milestones' table
create table milestones (
  id uuid not null primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  description text not null,
  due_date date,
  status text default 'open',
  created_at timestamptz default now()
);

-- Create the 'project_funding' table
create table project_funding (
  id uuid not null primary key default gen_random_uuid(),
  project_id uuid references projects(id),
  source text not null,
  amount integer not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Enable RLS for the new tables
alter table milestones enable row level security;
alter table project_funding enable row level security;

-- RLS policies for the new tables
create policy "Milestones are viewable by everyone." on milestones for select using (true);
create policy "Project members can insert milestones." on milestones for insert with check (true); -- More specific rules needed

create policy "Project funding is viewable by everyone." on project_funding for select using (true);
create policy "Project members can insert funding." on project_funding for insert with check (true); -- More specific rules needed
