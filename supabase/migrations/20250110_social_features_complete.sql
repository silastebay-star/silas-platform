-- Complete Social Features Migration
-- Adds all tables and functionality for social feed, forums, comments, and engagement

BEGIN;

-- ============================================================================
-- SOCIAL FEED INFRASTRUCTURE
-- ============================================================================

-- Feed items table (main social feed content)
CREATE TABLE IF NOT EXISTS public.feed_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('pin_created', 'pin_updated', 'proposal_created', 'proposal_voted', 'project_milestone', 'group_activity', 'user_post', 'announcement')),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}',
  related_pin_id uuid REFERENCES public.pins(id) ON DELETE SET NULL,
  related_proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  related_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  related_group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  is_pinned boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Feed engagement tracking
CREATE TABLE IF NOT EXISTS public.feed_engagement (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feed_item_id uuid NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- User engagement with feed items
CREATE TABLE IF NOT EXISTS public.user_feed_engagement (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_item_id uuid NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
  liked boolean DEFAULT false,
  bookmarked boolean DEFAULT false,
  shared boolean DEFAULT false,
  viewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feed_item_id)
);

-- ============================================================================
-- FORUM SYSTEM
-- ============================================================================

-- Forum categories
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'message-square',
  color text DEFAULT 'bg-blue-500',
  is_locked boolean DEFAULT false,
  display_order integer DEFAULT 0,
  moderators text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Forum topics
CREATE TABLE IF NOT EXISTS public.forum_topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  category_id uuid NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  is_locked boolean DEFAULT false,
  is_solved boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Forum posts
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid NOT NULL REFERENCES public.forum_topics(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_solution boolean DEFAULT false,
  is_original_post boolean DEFAULT false,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post reactions
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('likes', 'dislikes', 'hearts')),
  count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(post_id, reaction_type)
);

-- User post reactions
CREATE TABLE IF NOT EXISTS public.user_post_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'heart')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- ============================================================================
-- ENHANCED COMMENT SYSTEM
-- ============================================================================

-- Comments table (universal commenting system)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('pin', 'proposal', 'project', 'feed_item', 'forum_post')),
  target_id uuid NOT NULL,
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  moderation_status text DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'pending', 'flagged', 'removed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comment reactions
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('likes', 'dislikes', 'hearts')),
  count integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, reaction_type)
);

-- User comment reactions
CREATE TABLE IF NOT EXISTS public.user_comment_reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike', 'heart')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- ============================================================================
-- SOCIAL FOLLOWING SYSTEM
-- ============================================================================

-- User follows
CREATE TABLE IF NOT EXISTS public.user_follows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, followed_id),
  CHECK(follower_id != followed_id)
);

-- ============================================================================
-- MODERATION SYSTEM
-- ============================================================================

-- Comment flags
CREATE TABLE IF NOT EXISTS public.comment_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  flagger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Moderation log
CREATE TABLE IF NOT EXISTS public.moderation_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  moderator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  action text NOT NULL,
  reason text,
  previous_status text,
  new_status text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ACTIVITY LOGGING
-- ============================================================================

-- Activity log (enhanced)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- ENHANCED USER PROFILES
-- ============================================================================

-- Add social fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS reputation integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Feed items indexes
CREATE INDEX IF NOT EXISTS idx_feed_items_type ON public.feed_items (type);
CREATE INDEX IF NOT EXISTS idx_feed_items_author_id ON public.feed_items (author_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_created_at ON public.feed_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_items_related_pin ON public.feed_items (related_pin_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_related_proposal ON public.feed_items (related_proposal_id);

-- Forum indexes
CREATE INDEX IF NOT EXISTS idx_forum_topics_category_id ON public.forum_topics (category_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_author_id ON public.forum_topics (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_updated_at ON public.forum_topics (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON public.forum_posts (topic_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON public.forum_posts (author_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_target ON public.comments (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments (author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments (parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments (created_at DESC);

-- Social indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed ON public.user_follows (followed_id);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_target ON public.activity_log (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log (created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feed_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Feed items policies
CREATE POLICY "Feed items are viewable by everyone" ON public.feed_items
  FOR SELECT USING (NOT is_hidden);

CREATE POLICY "Users can create their own feed items" ON public.feed_items
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own feed items" ON public.feed_items
  FOR UPDATE USING (auth.uid() = author_id);

-- Forum policies
CREATE POLICY "Forum categories are viewable by everyone" ON public.forum_categories
  FOR SELECT USING (true);

CREATE POLICY "Forum topics are viewable by everyone" ON public.forum_topics
  FOR SELECT USING (true);

CREATE POLICY "Users can create forum topics" ON public.forum_topics
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Forum posts are viewable by everyone" ON public.forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create forum posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON public.comments
  FOR SELECT USING (NOT is_hidden AND NOT is_deleted);

CREATE POLICY "Users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Social follow policies
CREATE POLICY "Users can view follows" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create follows" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- User engagement policies
CREATE POLICY "Users can view their own engagement" ON public.user_feed_engagement
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own engagement" ON public.user_feed_engagement
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert default forum categories
INSERT INTO public.forum_categories (name, description, icon, color, display_order) VALUES
('General Discussion', 'General community discussions and announcements', 'message-square', 'bg-blue-500', 1),
('Community Projects', 'Discuss ongoing and proposed community projects', 'activity', 'bg-green-500', 2),
('Local Issues', 'Report and discuss local community issues', 'alert-triangle', 'bg-orange-500', 3),
('Help & Support', 'Get help with using the platform and community resources', 'help-circle', 'bg-purple-500', 4)
ON CONFLICT DO NOTHING;

COMMIT;
