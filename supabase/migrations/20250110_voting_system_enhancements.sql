-- Enhanced Voting System Migration
-- Adds missing tables and columns for comprehensive voting functionality

BEGIN;

-- ============================================================================
-- ENHANCE PROPOSALS TABLE
-- ============================================================================

-- Add missing columns to proposals table
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS expected_outcome text,
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS voting_config jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_amount decimal(12,2),
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS attachments text[],
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS voting_deadline timestamptz;

-- Update existing proposals to have default values
UPDATE public.proposals 
SET 
  title = COALESCE(title, 'Untitled Proposal'),
  voting_config = COALESCE(voting_config, '{"requires_quorum": true, "quorum_percentage": 25, "allow_abstain": true, "is_anonymous": false}'::jsonb),
  category = COALESCE(category, 'governance'),
  voting_deadline = COALESCE(voting_deadline, created_at + interval '7 days')
WHERE title IS NULL OR title = '';

-- Make title NOT NULL after setting defaults
ALTER TABLE public.proposals ALTER COLUMN title SET NOT NULL;

-- ============================================================================
-- PROPOSAL COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proposal_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.proposal_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ENHANCED NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_proposal', 'voting_deadline', 'voting_result', 'proposal_comment', 'pin_update', 'group_activity')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- VOTING ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.voting_analytics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  total_eligible_voters integer DEFAULT 0,
  participation_rate decimal(5,2),
  demographic_breakdown jsonb DEFAULT '{}',
  voting_pattern_analysis jsonb DEFAULT '{}',
  calculated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PROPOSAL LIFECYCLE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.proposal_lifecycle (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  stage text NOT NULL CHECK (stage IN ('draft', 'review', 'active', 'voting', 'decided', 'implemented', 'archived')),
  stage_data jsonb DEFAULT '{}',
  entered_at timestamptz DEFAULT now(),
  exited_at timestamptz,
  duration_minutes integer,
  notes text
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Proposal comments indexes
CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal_id ON public.proposal_comments (proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_comments_author_id ON public.proposal_comments (author_id);
CREATE INDEX IF NOT EXISTS idx_proposal_comments_parent_id ON public.proposal_comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_proposal_comments_created_at ON public.proposal_comments (created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- Enhanced proposals indexes
CREATE INDEX IF NOT EXISTS idx_proposals_category ON public.proposals (category);
CREATE INDEX IF NOT EXISTS idx_proposals_priority ON public.proposals (priority);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_deadline ON public.proposals (voting_deadline);
CREATE INDEX IF NOT EXISTS idx_proposals_tags ON public.proposals USING GIN (tags);

-- Voting analytics indexes
CREATE INDEX IF NOT EXISTS idx_voting_analytics_proposal_id ON public.voting_analytics (proposal_id);
CREATE INDEX IF NOT EXISTS idx_voting_analytics_calculated_at ON public.voting_analytics (calculated_at DESC);

-- Proposal lifecycle indexes
CREATE INDEX IF NOT EXISTS idx_proposal_lifecycle_proposal_id ON public.proposal_lifecycle (proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_lifecycle_stage ON public.proposal_lifecycle (stage);
CREATE INDEX IF NOT EXISTS idx_proposal_lifecycle_entered_at ON public.proposal_lifecycle (entered_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_lifecycle ENABLE ROW LEVEL SECURITY;

-- Proposal comments policies
CREATE POLICY "Proposal comments are viewable by everyone" ON public.proposal_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own comments" ON public.proposal_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON public.proposal_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments" ON public.proposal_comments
  FOR DELETE USING (auth.uid() = author_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Voting analytics policies (read-only for most users)
CREATE POLICY "Voting analytics are viewable by everyone" ON public.voting_analytics
  FOR SELECT USING (true);

-- Proposal lifecycle policies (read-only for most users)
CREATE POLICY "Proposal lifecycle is viewable by everyone" ON public.proposal_lifecycle
  FOR SELECT USING (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update proposal vote counts
CREATE OR REPLACE FUNCTION update_proposal_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment the appropriate vote count
    UPDATE public.proposals 
    SET 
      votes_for = CASE WHEN NEW.vote = 'yes' THEN votes_for + 1 ELSE votes_for END,
      votes_against = CASE WHEN NEW.vote = 'no' THEN votes_against + 1 ELSE votes_against END,
      votes_abstain = CASE WHEN NEW.vote = 'abstain' THEN votes_abstain + 1 ELSE votes_abstain END
    WHERE id = NEW.proposal_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement the appropriate vote count
    UPDATE public.proposals 
    SET 
      votes_for = CASE WHEN OLD.vote = 'yes' THEN votes_for - 1 ELSE votes_for END,
      votes_against = CASE WHEN OLD.vote = 'no' THEN votes_against - 1 ELSE votes_against END,
      votes_abstain = CASE WHEN OLD.vote = 'abstain' THEN votes_abstain - 1 ELSE votes_abstain END
    WHERE id = OLD.proposal_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
DROP TRIGGER IF EXISTS trigger_update_proposal_vote_counts ON public.votes;
CREATE TRIGGER trigger_update_proposal_vote_counts
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_vote_counts();

-- Function to automatically update proposal status based on voting deadline
CREATE OR REPLACE FUNCTION check_proposal_deadlines()
RETURNS void AS $$
BEGIN
  -- Mark proposals as expired if voting deadline has passed
  UPDATE public.proposals 
  SET status = 'expired'
  WHERE status = 'active' 
    AND voting_deadline < now();
    
  -- Determine results for expired proposals
  UPDATE public.proposals 
  SET status = CASE 
    WHEN votes_for > votes_against THEN 'approved'
    ELSE 'rejected'
  END
  WHERE status = 'expired'
    AND (votes_for + votes_against + votes_abstain) > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample notification types configuration
INSERT INTO public.notifications (user_id, type, title, message, data, read) 
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'new_proposal',
  'Welcome to SILAS Voting',
  'You can now participate in community decision-making through our democratic voting system.',
  '{"system": true}',
  false
WHERE EXISTS (SELECT 1 FROM auth.users)
ON CONFLICT DO NOTHING;

COMMIT;
