
-- Create the 'profiles' table
create table profiles (
  id uuid not null primary key,
  display_name text,
  role text,
  verified boolean default false,
  metadata jsonb,
  constraint id_fk foreign key (id) references auth.users (id)
);

-- Create the 'pins' table
create table pins (
  id uuid not null primary key default gen_random_uuid(),
  title text,
  description text,
  categories text[],
  project_id uuid,
  group_id uuid,
  author_id uuid,
  geom geometry(Point, 4326),
  status text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create the 'groups' table
create table groups (
  id uuid not null primary key default gen_random_uuid(),
  name text,
  description text,
  owner_id uuid,
  public boolean default true,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Create the 'group_members' table
create table group_members (
  group_id uuid not null,
  profile_id uuid not null,
  role text,
  joined_at timestamptz default now(),
  primary key (group_id, profile_id)
);

-- Create the 'projects' table
create table projects (
  id uuid not null primary key default gen_random_uuid(),
  name text,
  description text,
  group_id uuid,
  status text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create the 'proposals' table
create table proposals (
  id uuid not null primary key default gen_random_uuid(),
  pin_id uuid,
  proposer_id uuid,
  action text,
  payload jsonb,
  status text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- Create the 'votes' table
create table votes (
  id uuid not null primary key default gen_random_uuid(),
  proposal_id uuid,
  voter_id uuid,
  vote text,
  created_at timestamptz default now()
);

-- Create the 'comments' table
create table comments (
  id uuid not null primary key default gen_random_uuid(),
  pin_id uuid,
  author_id uuid,
  content text,
  parent_comment_id uuid,
  created_at timestamptz default now()
);

-- Add foreign key constraints
alter table pins add constraint project_id_fk foreign key (project_id) references projects (id);
alter table pins add constraint group_id_fk foreign key (group_id) references groups (id);
alter table pins add constraint author_id_fk foreign key (author_id) references profiles (id);

alter table groups add constraint owner_id_fk foreign key (owner_id) references profiles (id);

alter table group_members add constraint group_id_fk foreign key (group_id) references groups (id);
alter table group_members add constraint profile_id_fk foreign key (profile_id) references profiles (id);

alter table projects add constraint group_id_fk foreign key (group_id) references groups (id);

alter table proposals add constraint pin_id_fk foreign key (pin_id) references pins (id);
alter table proposals add constraint proposer_id_fk foreign key (proposer_id) references profiles (id);

alter table votes add constraint proposal_id_fk foreign key (proposal_id) references proposals (id);
alter table votes add constraint voter_id_fk foreign key (voter_id) references profiles (id);

alter table comments add constraint pin_id_fk foreign key (pin_id) references pins (id);
alter table comments add constraint author_id_fk foreign key (author_id) references profiles (id);
alter table comments add constraint parent_comment_id_fk foreign key (parent_comment_id) references comments (id);
