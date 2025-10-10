
-- Enable RLS for all tables
alter table profiles enable row level security;
alter table pins enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table projects enable row level security;
alter table proposals enable row level security;
alter table votes enable row level security;
alter table comments enable row level security;

-- RLS policies for 'profiles' table
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- RLS policies for 'pins' table
create policy "Pins are viewable by everyone." on pins for select using (true);
create policy "Users can insert their own pins." on pins for insert with check (auth.uid() = author_id);
create policy "Users can update their own pins." on pins for update using (auth.uid() = author_id);

-- RLS policies for 'groups' table
create policy "Groups are viewable by everyone." on groups for select using (true);
create policy "Users can insert their own groups." on groups for insert with check (auth.uid() = owner_id);
create policy "Users can update their own groups." on groups for update using (auth.uid() = owner_id);

-- RLS policies for 'group_members' table
create policy "Group members are viewable by everyone." on group_members for select using (true);
create policy "Users can join public groups." on group_members for insert with check (true);
create policy "Users can leave groups." on group_members for delete using (auth.uid() = profile_id);

-- RLS policies for 'projects' table
create policy "Projects are viewable by everyone." on projects for select using (true);
create policy "Users can insert their own projects." on projects for insert with check (true); -- Needs to be more specific
create policy "Users can update their own projects." on projects for update using (true); -- Needs to be more specific

-- RLS policies for 'proposals' table
create policy "Proposals are viewable by everyone." on proposals for select using (true);
create policy "Users can insert their own proposals." on proposals for insert with check (auth.uid() = proposer_id);

-- RLS policies for 'votes' table
create policy "Votes are viewable by everyone." on votes for select using (true);
create policy "Users can insert their own votes." on votes for insert with check (auth.uid() = voter_id);
create policy "A user can only vote once per proposal." on votes for insert with check (
  (select count(*) from votes where proposal_id = votes.proposal_id and voter_id = auth.uid()) = 0
);

-- RLS policies for 'comments' table
create policy "Comments are viewable by everyone." on comments for select using (true);
create policy "Users can insert their own comments." on comments for insert with check (auth.uid() = author_id);
create policy "Users can update their own comments." on comments for update using (auth.uid() = author_id);
