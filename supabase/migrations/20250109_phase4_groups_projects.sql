-- Phase 4: Groups & Projects Database Schema
-- This migration creates the complete database structure for Phase 4 as specified in TODO.md

-- ============================================================================
-- GROUPS SYSTEM (Update existing groups table to match TODO specs)
-- ============================================================================

-- First, let's ensure we have the proper groups table structure
-- Note: We're checking if columns exist before adding them to avoid conflicts

DO $$ 
BEGIN
  -- Check if we need to add any missing columns to groups table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'groups' AND column_name = 'public') THEN
    ALTER TABLE public.groups ADD COLUMN public boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'groups' AND column_name = 'metadata') THEN
    ALTER TABLE public.groups ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'groups' AND column_name = 'owner_id') THEN
    ALTER TABLE public.groups ADD COLUMN owner_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- ============================================================================
-- GROUP MEMBERS TABLE (Many-to-Many relationship)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, profile_id)
);

-- ============================================================================
-- PROJECTS TABLE (Complete implementation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled', 'on_hold')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date date,
  end_date date,
  budget decimal(10,2),
  funding_raised decimal(10,2) DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PROJECT MEMBERS TABLE (Many-to-Many for project participation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('member', 'coordinator', 'lead')),
  joined_at timestamptz DEFAULT now(),
  contribution_hours decimal(5,2) DEFAULT 0,
  UNIQUE(project_id, user_id)
);

-- ============================================================================
-- UPDATE PINS TABLE (Add project_id if not exists)
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'pins' AND column_name = 'project_id') THEN
    ALTER TABLE public.pins ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- PROPOSALS TABLE (For democratic decision making)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pin_id uuid REFERENCES public.pins(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  proposer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('create_pin', 'edit_pin', 'delete_pin', 'fund_request', 'project_milestone')),
  title text NOT NULL,
  description text,
  payload jsonb DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  votes_for integer DEFAULT 0,
  votes_against integer DEFAULT 0,
  votes_abstain integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- VOTES TABLE (For proposal voting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE,
  voter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, voter_id)
);

-- ============================================================================
-- PROJECT MILESTONES (Enhanced from existing)
-- ============================================================================

-- Update existing milestones table if it exists, or create new one
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_name = 'milestones') THEN
    CREATE TABLE public.milestones (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text,
      due_date date,
      status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
      created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now(),
      completed_at timestamptz
    );
  END IF;
END $$;

-- ============================================================================
-- PROJECT FUNDING (Enhanced from existing)
-- ============================================================================

-- Update existing project_funding table if it exists, or create new one
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                 WHERE table_name = 'project_funding') THEN
    CREATE TABLE public.project_funding (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
      source text NOT NULL,
      amount decimal(10,2) NOT NULL,
      currency text DEFAULT 'GBP',
      status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'received', 'cancelled')),
      funding_type text DEFAULT 'grant' CHECK (funding_type IN ('grant', 'donation', 'crowdfund', 'council', 'business')),
      funder_name text,
      funder_contact text,
      conditions text,
      created_at timestamptz DEFAULT now(),
      approved_at timestamptz,
      received_at timestamptz
    );
  END IF;
END $$;

-- ============================================================================
-- COMMENTS TABLE (Enhanced for both pins and projects)
-- ============================================================================

-- Check if we need to add project_id to existing comments table
DO $$ 
BEGIN
  -- If pin_comments table exists, check if it has project_id
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pin_comments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'pin_comments' AND column_name = 'project_id') THEN
      ALTER TABLE public.pin_comments ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
  ELSE
    -- Create comments table if it doesn't exist
    CREATE TABLE public.comments (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      pin_id uuid REFERENCES public.pins(id) ON DELETE CASCADE,
      project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
      author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      content text NOT NULL,
      parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CHECK (pin_id IS NOT NULL OR project_id IS NOT NULL)
    );
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Groups indexes
CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups (owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_public ON public.groups (public);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups (created_at DESC);

-- Group members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_profile_id ON public.group_members (profile_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON public.group_members (role);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_group_id ON public.projects (group_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects (created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects (created_at DESC);

-- Project members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members (user_id);

-- Proposals indexes
CREATE INDEX IF NOT EXISTS idx_proposals_pin_id ON public.proposals (pin_id);
CREATE INDEX IF NOT EXISTS idx_proposals_project_id ON public.proposals (project_id);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer_id ON public.proposals (proposer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals (status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals (created_at DESC);

-- Votes indexes
CREATE INDEX IF NOT EXISTS idx_votes_proposal_id ON public.votes (proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_id ON public.votes (voter_id);

-- ============================================================================
-- CREATE FUNCTIONS FOR COUNT UPDATES
-- ============================================================================

-- Function to update group member count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups 
    SET member_count = COALESCE(member_count, 0) + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups 
    SET member_count = GREATEST(COALESCE(member_count, 1) - 1, 0) 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update project member count
CREATE OR REPLACE FUNCTION update_project_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                   jsonb_build_object('member_count', 
                     COALESCE((metadata->>'member_count')::integer, 0) + 1)
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects 
    SET metadata = COALESCE(metadata, '{}'::jsonb) || 
                   jsonb_build_object('member_count', 
                     GREATEST(COALESCE((metadata->>'member_count')::integer, 1) - 1, 0))
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update proposal vote counts
CREATE OR REPLACE FUNCTION update_proposal_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.proposals 
    SET 
      votes_for = CASE WHEN NEW.vote = 'yes' THEN votes_for + 1 ELSE votes_for END,
      votes_against = CASE WHEN NEW.vote = 'no' THEN votes_against + 1 ELSE votes_against END,
      votes_abstain = CASE WHEN NEW.vote = 'abstain' THEN votes_abstain + 1 ELSE votes_abstain END
    WHERE id = NEW.proposal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.proposals 
    SET 
      votes_for = CASE WHEN OLD.vote = 'yes' THEN GREATEST(votes_for - 1, 0) ELSE votes_for END,
      votes_against = CASE WHEN OLD.vote = 'no' THEN GREATEST(votes_against - 1, 0) ELSE votes_against END,
      votes_abstain = CASE WHEN OLD.vote = 'abstain' THEN GREATEST(votes_abstain - 1, 0) ELSE votes_abstain END
    WHERE id = OLD.proposal_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.proposals 
    SET 
      votes_for = votes_for - CASE WHEN OLD.vote = 'yes' THEN 1 ELSE 0 END + CASE WHEN NEW.vote = 'yes' THEN 1 ELSE 0 END,
      votes_against = votes_against - CASE WHEN OLD.vote = 'no' THEN 1 ELSE 0 END + CASE WHEN NEW.vote = 'no' THEN 1 ELSE 0 END,
      votes_abstain = votes_abstain - CASE WHEN OLD.vote = 'abstain' THEN 1 ELSE 0 END + CASE WHEN NEW.vote = 'abstain' THEN 1 ELSE 0 END
    WHERE id = NEW.proposal_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Group member count triggers
DROP TRIGGER IF EXISTS trigger_update_group_member_count ON public.group_members;
CREATE TRIGGER trigger_update_group_member_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Project member count triggers
DROP TRIGGER IF EXISTS trigger_update_project_member_count ON public.project_members;
CREATE TRIGGER trigger_update_project_member_count
  AFTER INSERT OR DELETE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION update_project_member_count();

-- Proposal vote count triggers
DROP TRIGGER IF EXISTS trigger_update_proposal_vote_count ON public.votes;
CREATE TRIGGER trigger_update_proposal_vote_count
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION update_proposal_vote_count();

-- Updated_at triggers for new tables
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_funding ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BASIC RLS POLICIES
-- ============================================================================

-- Groups policies
CREATE POLICY "Groups are viewable by everyone" ON public.groups
  FOR SELECT USING (public = true OR auth.uid() = owner_id);

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" ON public.groups
  FOR UPDATE USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "Group memberships are viewable to group members" ON public.group_members
  FOR SELECT USING (
    profile_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_members.group_id AND gm.profile_id = auth.uid())
  );

CREATE POLICY "Users can join public groups" ON public.group_members
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.public = true)
  );

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (profile_id = auth.uid());

-- Projects policies
CREATE POLICY "Projects are viewable by everyone" ON public.projects
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project creators can update their projects" ON public.projects
  FOR UPDATE USING (auth.uid() = created_by);

-- Proposals policies
CREATE POLICY "Proposals are viewable by everyone" ON public.proposals
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create proposals" ON public.proposals
  FOR INSERT WITH CHECK (auth.uid() = proposer_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" ON public.votes
  FOR SELECT USING (true);

CREATE POLICY "Users can vote once per proposal" ON public.votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Milestones policies
CREATE POLICY "Milestones are viewable by everyone" ON public.milestones
  FOR SELECT USING (true);

-- Project funding policies
CREATE POLICY "Project funding is viewable by everyone" ON public.project_funding
  FOR SELECT USING (true);

-- ============================================================================
-- INSERT DEFAULT DATA (if needed)
-- ============================================================================

-- You can add any default groups or sample data here if needed
