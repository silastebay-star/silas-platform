
-- Create the 'security_alerts' table
create table security_alerts (
  id uuid not null primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Enable RLS for the 'security_alerts' table
alter table security_alerts enable row level security;

-- RLS policies for 'security_alerts' table
create policy "Security alerts are viewable by everyone." on security_alerts for select using (true);
create policy "Admins can insert security alerts." on security_alerts for insert with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
