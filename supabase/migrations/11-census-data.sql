
-- Create the 'census_data' table
create table census_data (
  id uuid not null primary key default gen_random_uuid(),
  lsoa_code text not null unique,
  population integer,
  deprivation_index real,
  geom geometry(Polygon, 4326),
  created_at timestamptz default now()
);

-- Enable RLS for the 'census_data' table
alter table census_data enable row level security;

-- RLS policies for 'census_data' table
create policy "Census data is viewable by everyone." on census_data for select using (true);
