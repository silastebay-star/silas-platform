-- SILAS Row Level Security Policies
-- Comprehensive security for multi-role community platform

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT COALESCE(role, 'guest')
    FROM user_profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_id) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is verified
CREATE OR REPLACE FUNCTION is_verified_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(is_verified, false)
    FROM user_profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- CATEGORIES POLICIES
-- =============================================

-- Everyone can read categories
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Only admins can modify categories
CREATE POLICY "Only admins can modify categories" ON categories
  FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- PINS POLICIES
-- =============================================

-- Public pins are viewable by everyone
CREATE POLICY "Public pins are viewable by everyone" ON pins
  FOR SELECT USING (
    social_visibility = 'public' 
    OR (social_visibility = 'members' AND auth.uid() IS NOT NULL)
    OR created_by = auth.uid()
    OR is_admin(auth.uid())
  );

-- Authenticated users can create pins
CREATE POLICY "Authenticated users can create pins" ON pins
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Users can update their own pins, admins can update any
CREATE POLICY "Users can update own pins, admins can update any" ON pins
  FOR UPDATE USING (
    created_by = auth.uid() 
    OR is_admin(auth.uid())
  );

-- Users can delete their own pins, admins can delete any
CREATE POLICY "Users can delete own pins, admins can delete any" ON pins
  FOR DELETE USING (
    created_by = auth.uid() 
    OR is_admin(auth.uid())
  );

-- =============================================
-- PROJECTS POLICIES
-- =============================================

-- Projects follow pin visibility
CREATE POLICY "Projects follow pin visibility" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pins 
      WHERE pins.id = projects.pin_id 
      AND (
        pins.social_visibility = 'public' 
        OR (pins.social_visibility = 'members' AND auth.uid() IS NOT NULL)
        OR pins.created_by = auth.uid()
        OR is_admin(auth.uid())
      )
    )
  );

-- Project creators and admins can modify
CREATE POLICY "Project creators and admins can modify projects" ON projects
  FOR ALL USING (
    created_by = auth.uid() 
    OR is_admin(auth.uid())
  );

-- =============================================
-- SOCIAL INTERACTION POLICIES
-- =============================================

-- Pin reactions: users can read all, create/update/delete their own
CREATE POLICY "Users can view all reactions" ON pin_reactions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own reactions" ON pin_reactions
  FOR ALL USING (user_id = auth.uid());

-- Pin comments: follow pin visibility for reading
CREATE POLICY "Comments follow pin visibility" ON pin_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pins 
      WHERE pins.id = pin_comments.pin_id 
      AND (
        pins.social_visibility = 'public' 
        OR (pins.social_visibility = 'members' AND auth.uid() IS NOT NULL)
        OR pins.created_by = auth.uid()
        OR is_admin(auth.uid())
      )
    )
  );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON pin_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

-- Users can update/delete their own comments, admins can moderate
CREATE POLICY "Users can manage own comments, admins can moderate" ON pin_comments
  FOR UPDATE USING (
    user_id = auth.uid() 
    OR is_admin(auth.uid())
  );

CREATE POLICY "Users can delete own comments, admins can moderate" ON pin_comments
  FOR DELETE USING (
    user_id = auth.uid() 
    OR is_admin(auth.uid())
  );

-- Pin shares: users can create their own
CREATE POLICY "Users can create shares" ON pin_shares
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can view shares" ON pin_shares
  FOR SELECT USING (true);

-- =============================================
-- FUND SYSTEM POLICIES
-- =============================================

-- Fund ledger: admins can manage, users can view public entries
CREATE POLICY "Fund ledger visibility" ON fund_ledger
  FOR SELECT USING (
    is_admin(auth.uid())
    OR transaction_type IN ('contribution', 'allocation')
  );

-- Only admins can modify fund ledger
CREATE POLICY "Only admins can modify fund ledger" ON fund_ledger
  FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- VOTING SYSTEM POLICIES
-- =============================================

-- Polls: public polls viewable by all, others by members
CREATE POLICY "Poll visibility" ON polls
  FOR SELECT USING (
    status = 'active'
    AND (
      category_id IS NULL 
      OR auth.uid() IS NOT NULL
      OR is_admin(auth.uid())
    )
  );

-- Verified users and admins can create polls
CREATE POLICY "Verified users can create polls" ON polls
  FOR INSERT WITH CHECK (
    (is_verified_user(auth.uid()) OR is_admin(auth.uid()))
    AND created_by = auth.uid()
  );

-- Poll creators and admins can modify
CREATE POLICY "Poll creators and admins can modify polls" ON polls
  FOR UPDATE USING (
    created_by = auth.uid() 
    OR is_admin(auth.uid())
  );

-- Poll options follow poll visibility
CREATE POLICY "Poll options follow poll visibility" ON poll_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_options.poll_id 
      AND polls.status = 'active'
    )
  );

-- Poll votes: users can create their own, view aggregated results
CREATE POLICY "Users can vote in active polls" ON poll_votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = poll_id 
      AND polls.status = 'active'
      AND (polls.end_date IS NULL OR polls.end_date > NOW())
    )
  );

-- Users can view their own votes, admins can view all
CREATE POLICY "Vote visibility" ON poll_votes
  FOR SELECT USING (
    user_id = auth.uid() 
    OR is_admin(auth.uid())
  );

-- =============================================
-- EVENTS POLICIES
-- =============================================

-- Public events viewable by all, private by members
CREATE POLICY "Event visibility" ON events
  FOR SELECT USING (
    is_public = true 
    OR auth.uid() IS NOT NULL
    OR created_by = auth.uid()
    OR is_admin(auth.uid())
  );

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON events
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    AND created_by = auth.uid()
  );

-- Event creators and admins can modify
CREATE POLICY "Event creators and admins can modify events" ON events
  FOR UPDATE USING (
    created_by = auth.uid() 
    OR is_admin(auth.uid())
  );

-- =============================================
-- AI DOCUMENTS POLICIES
-- =============================================

-- Public AI documents viewable by all
CREATE POLICY "Public AI documents are viewable" ON ai_documents
  FOR SELECT USING (
    is_public = true 
    OR auth.uid() IS NOT NULL
  );

-- Only admins can modify AI documents
CREATE POLICY "Only admins can modify AI documents" ON ai_documents
  FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- USER PROFILES POLICIES
-- =============================================

-- Users can view all public profiles
CREATE POLICY "Public profiles are viewable" ON user_profiles
  FOR SELECT USING (true);

-- Users can manage their own profile
CREATE POLICY "Users can manage own profile" ON user_profiles
  FOR ALL USING (id = auth.uid());

-- Admins can view and modify any profile
CREATE POLICY "Admins can manage any profile" ON user_profiles
  FOR ALL USING (is_admin(auth.uid()));

-- =============================================
-- FUNCTIONS FOR SOCIAL COUNTS
-- =============================================

-- Get reaction counts for a pin
CREATE OR REPLACE FUNCTION get_pin_reaction_counts(pin_uuid UUID)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      jsonb_object_agg(reaction_type, count), 
      '{}'::jsonb
    )
    FROM (
      SELECT reaction_type, COUNT(*)::int as count
      FROM pin_reactions 
      WHERE pin_id = pin_uuid
      GROUP BY reaction_type
    ) counts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get comment count for a pin
CREATE OR REPLACE FUNCTION get_pin_comment_count(pin_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::int
    FROM pin_comments 
    WHERE pin_id = pin_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
