-- SILAS Community Autonomy System Migration
-- Transform existing platform into comprehensive civic operating system
-- Date: 2025-01-08

-- =============================================
-- UPDATE CATEGORY SYSTEM TO MATCH DIRECTIVE
-- =============================================

-- Update existing categories to match the 8 required categories
UPDATE categories SET 
  name = 'Environment & Wildlife',
  slug = 'environment',
  description = 'Environmental protection & wildlife conservation',
  icon = 'Leaf',
  color = '#059669',
  sort_order = 5
WHERE slug = 'environment' OR name = 'Environment & Sustainability';

-- Add Safety & Response category (replacing Issues & Response)
INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES
('Safety & Response', 'safety', 'Emergency response & community safety', 'AlertTriangle', '#DC2626', 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Update pin_category enum to match new categories
ALTER TYPE pin_category RENAME TO pin_category_old;
CREATE TYPE pin_category AS ENUM (
  'community',
  'projects', 
  'events',
  'economy',
  'environment',
  'safety',
  'faith',
  'data_ai'
);

-- Update pins table to use new enum
ALTER TABLE pins ALTER COLUMN category TYPE pin_category USING 
  CASE category::text
    WHEN 'issues' THEN 'safety'::pin_category
    WHEN 'heritage_culture' THEN 'community'::pin_category
    WHEN 'governance' THEN 'data_ai'::pin_category
    ELSE category::text::pin_category
  END;

-- Drop old enum
DROP TYPE pin_category_old;

-- =============================================
-- ENHANCE PINS TABLE FOR COMMUNITY AUTONOMY
-- =============================================

-- Add enhanced fields to pins table
ALTER TABLE pins ADD COLUMN IF NOT EXISTS category_data JSONB DEFAULT '{}';
ALTER TABLE pins ADD COLUMN IF NOT EXISTS discussion_enabled BOOLEAN DEFAULT true;
ALTER TABLE pins ADD COLUMN IF NOT EXISTS voting_enabled BOOLEAN DEFAULT false;
ALTER TABLE pins ADD COLUMN IF NOT EXISTS fund_request_amount DECIMAL(10,2);
ALTER TABLE pins ADD COLUMN IF NOT EXISTS fund_approved_amount DECIMAL(10,2);
ALTER TABLE pins ADD COLUMN IF NOT EXISTS priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent'));

-- =============================================
-- PIN-BASED DISCUSSION SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS pin_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pin_posts(id) ON DELETE CASCADE, -- For threaded discussions
  content TEXT NOT NULL,
  post_type VARCHAR(20) DEFAULT 'comment' CHECK (post_type IN ('comment', 'update', 'question', 'proposal')),
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  
  -- Moderation
  is_edited BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for pin posts
CREATE INDEX idx_pin_posts_pin_id ON pin_posts(pin_id);
CREATE INDEX idx_pin_posts_user_id ON pin_posts(user_id);
CREATE INDEX idx_pin_posts_parent_id ON pin_posts(parent_id);
CREATE INDEX idx_pin_posts_created_at ON pin_posts(created_at DESC);

-- =============================================
-- VOTING & DECISION MAKING SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS pin_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('support', 'oppose', 'abstain', 'priority_high', 'priority_low')),
  vote_weight INTEGER DEFAULT 1,
  
  -- Metadata
  comment TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(pin_id, user_id, vote_type)
);

-- Create indexes for voting
CREATE INDEX idx_pin_votes_pin_id ON pin_votes(pin_id);
CREATE INDEX idx_pin_votes_user_id ON pin_votes(user_id);
CREATE INDEX idx_pin_votes_type ON pin_votes(vote_type);

-- =============================================
-- COMMUNITY FUND SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS fund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('contribution', 'allocation', 'refund', 'fee')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  
  -- Source tracking
  stripe_payment_intent_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  contributor_user_id UUID REFERENCES auth.users(id),
  
  -- Allocation tracking  
  pin_id UUID REFERENCES pins(id),
  project_id UUID REFERENCES projects(id),
  allocated_by UUID REFERENCES auth.users(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fund transactions
CREATE INDEX idx_fund_transactions_type ON fund_transactions(transaction_type);
CREATE INDEX idx_fund_transactions_pin_id ON fund_transactions(pin_id);
CREATE INDEX idx_fund_transactions_contributor ON fund_transactions(contributor_user_id);
CREATE INDEX idx_fund_transactions_status ON fund_transactions(status);
CREATE INDEX idx_fund_transactions_created_at ON fund_transactions(created_at DESC);

-- =============================================
-- AI KNOWLEDGE & RAG SYSTEM
-- =============================================

CREATE TABLE IF NOT EXISTS ai_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text',
  
  -- Source tracking
  source_type VARCHAR(50) CHECK (source_type IN ('pin', 'post', 'project', 'event', 'manual', 'census')),
  source_id UUID, -- References the source record
  
  -- Vector embedding for RAG (using pgvector)
  embedding vector(384), -- Adjust dimension based on model
  
  -- Categorization
  category_id UUID REFERENCES categories(id),
  tags TEXT[],
  
  -- Visibility and access
  is_public BOOLEAN DEFAULT true,
  access_level VARCHAR(20) DEFAULT 'public' CHECK (access_level IN ('public', 'members', 'admin')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector similarity search index (requires pgvector extension)
-- CREATE INDEX ON ai_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create other indexes for AI documents
CREATE INDEX idx_ai_documents_source ON ai_documents(source_type, source_id);
CREATE INDEX idx_ai_documents_category ON ai_documents(category_id);
CREATE INDEX idx_ai_documents_public ON ai_documents(is_public);
CREATE INDEX idx_ai_documents_created_at ON ai_documents(created_at DESC);

-- =============================================
-- ENHANCED NOTIFICATION SYSTEM
-- =============================================

-- Extend notification types for community autonomy features
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'pin_post_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'pin_vote_cast';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fund_contribution';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'fund_allocation';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'project_milestone';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'emergency_alert';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ai_insight';

-- =============================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================

CREATE TRIGGER update_pin_posts_updated_at 
  BEFORE UPDATE ON pin_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pin_votes_updated_at 
  BEFORE UPDATE ON pin_votes 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fund_transactions_updated_at 
  BEFORE UPDATE ON fund_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_documents_updated_at 
  BEFORE UPDATE ON ai_documents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMPUTED FIELDS AND AGGREGATION TRIGGERS
-- =============================================

-- Function to update pin post counts
CREATE OR REPLACE FUNCTION update_pin_post_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Update reply count for parent post
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE pin_posts SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
    END IF;
    
    -- Update comment count for pin
    UPDATE pins SET comment_count = comment_count + 1 WHERE id = NEW.pin_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update reply count for parent post
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE pin_posts SET reply_count = reply_count - 1 WHERE id = OLD.parent_id;
    END IF;
    
    -- Update comment count for pin
    UPDATE pins SET comment_count = comment_count - 1 WHERE id = OLD.pin_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for post count updates
CREATE TRIGGER trigger_update_pin_post_counts
  AFTER INSERT OR DELETE ON pin_posts
  FOR EACH ROW EXECUTE FUNCTION update_pin_post_counts();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_pin_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update vote counts in pin metadata
    UPDATE pins SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{vote_counts}',
      (
        SELECT jsonb_object_agg(vote_type, count)
        FROM (
          SELECT vote_type, COUNT(*) as count
          FROM pin_votes 
          WHERE pin_id = NEW.pin_id
          GROUP BY vote_type
        ) vote_summary
      )
    ) WHERE id = NEW.pin_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update vote counts in pin metadata
    UPDATE pins SET metadata = jsonb_set(
      COALESCE(metadata, '{}'),
      '{vote_counts}',
      (
        SELECT jsonb_object_agg(vote_type, count)
        FROM (
          SELECT vote_type, COUNT(*) as count
          FROM pin_votes 
          WHERE pin_id = OLD.pin_id
          GROUP BY vote_type
        ) vote_summary
      )
    ) WHERE id = OLD.pin_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
CREATE TRIGGER trigger_update_pin_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON pin_votes
  FOR EACH ROW EXECUTE FUNCTION update_pin_vote_counts();

-- =============================================
-- DATABASE FUNCTIONS FOR AI AND ANALYTICS
-- =============================================

-- Function to search documents by vector similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(384),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  title varchar(255),
  content text,
  content_type varchar(50),
  source_type varchar(50),
  source_id uuid,
  category_id uuid,
  tags text[],
  is_public boolean,
  access_level varchar(20),
  metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    ai_documents.id,
    ai_documents.title,
    ai_documents.content,
    ai_documents.content_type,
    ai_documents.source_type,
    ai_documents.source_id,
    ai_documents.category_id,
    ai_documents.tags,
    ai_documents.is_public,
    ai_documents.access_level,
    ai_documents.metadata,
    ai_documents.created_at,
    ai_documents.updated_at,
    1 - (ai_documents.embedding <=> query_embedding) as similarity
  FROM ai_documents
  WHERE ai_documents.embedding <=> query_embedding < 1 - similarity_threshold
    AND ai_documents.is_public = true
  ORDER BY ai_documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Function to get engagement trends
CREATE OR REPLACE FUNCTION get_engagement_trends(weeks int DEFAULT 12)
RETURNS TABLE (
  period text,
  pins_created int,
  comments_posted int,
  votes_cast int,
  fund_contributions int
)
LANGUAGE sql STABLE
AS $$
  WITH weekly_data AS (
    SELECT
      date_trunc('week', created_at) as week_start,
      'pins' as activity_type,
      COUNT(*) as count
    FROM pins
    WHERE created_at >= NOW() - INTERVAL '1 week' * weeks
    GROUP BY date_trunc('week', created_at)

    UNION ALL

    SELECT
      date_trunc('week', created_at) as week_start,
      'comments' as activity_type,
      COUNT(*) as count
    FROM pin_posts
    WHERE created_at >= NOW() - INTERVAL '1 week' * weeks
    GROUP BY date_trunc('week', created_at)

    UNION ALL

    SELECT
      date_trunc('week', created_at) as week_start,
      'votes' as activity_type,
      COUNT(*) as count
    FROM pin_votes
    WHERE created_at >= NOW() - INTERVAL '1 week' * weeks
    GROUP BY date_trunc('week', created_at)

    UNION ALL

    SELECT
      date_trunc('week', created_at) as week_start,
      'contributions' as activity_type,
      COUNT(*) as count
    FROM fund_transactions
    WHERE created_at >= NOW() - INTERVAL '1 week' * weeks
      AND transaction_type = 'contribution'
      AND status = 'completed'
    GROUP BY date_trunc('week', created_at)
  )
  SELECT
    to_char(week_start, 'YYYY-MM-DD') as period,
    COALESCE(SUM(CASE WHEN activity_type = 'pins' THEN count END), 0)::int as pins_created,
    COALESCE(SUM(CASE WHEN activity_type = 'comments' THEN count END), 0)::int as comments_posted,
    COALESCE(SUM(CASE WHEN activity_type = 'votes' THEN count END), 0)::int as votes_cast,
    COALESCE(SUM(CASE WHEN activity_type = 'contributions' THEN count END), 0)::int as fund_contributions
  FROM weekly_data
  GROUP BY week_start
  ORDER BY week_start;
$$;

-- Function to get category activity
CREATE OR REPLACE FUNCTION get_category_activity()
RETURNS TABLE (
  category varchar(50),
  activity_score int,
  growth_rate float
)
LANGUAGE sql STABLE
AS $$
  WITH current_activity AS (
    SELECT
      p.category,
      COUNT(p.id) as pin_count,
      COUNT(pp.id) as post_count,
      COUNT(pv.id) as vote_count
    FROM pins p
    LEFT JOIN pin_posts pp ON p.id = pp.pin_id
    LEFT JOIN pin_votes pv ON p.id = pv.pin_id
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY p.category
  ),
  previous_activity AS (
    SELECT
      p.category,
      COUNT(p.id) as pin_count,
      COUNT(pp.id) as post_count,
      COUNT(pv.id) as vote_count
    FROM pins p
    LEFT JOIN pin_posts pp ON p.id = pp.pin_id
    LEFT JOIN pin_votes pv ON p.id = pv.pin_id
    WHERE p.created_at >= NOW() - INTERVAL '60 days'
      AND p.created_at < NOW() - INTERVAL '30 days'
    GROUP BY p.category
  )
  SELECT
    c.category::varchar(50),
    (c.pin_count + c.post_count + c.vote_count)::int as activity_score,
    CASE
      WHEN p.pin_count + p.post_count + p.vote_count > 0
      THEN ((c.pin_count + c.post_count + c.vote_count)::float / (p.pin_count + p.post_count + p.vote_count)::float - 1.0)
      ELSE 0.0
    END as growth_rate
  FROM current_activity c
  LEFT JOIN previous_activity p ON c.category = p.category
  ORDER BY activity_score DESC;
$$;

-- Function to get top contributors
CREATE OR REPLACE FUNCTION get_top_contributors(limit_count int DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  display_name varchar(100),
  contribution_score int
)
LANGUAGE sql STABLE
AS $$
  SELECT
    u.id as user_id,
    up.display_name,
    (
      COALESCE(pin_count.count, 0) * 3 +
      COALESCE(post_count.count, 0) * 2 +
      COALESCE(vote_count.count, 0) * 1 +
      COALESCE(fund_count.count, 0) * 5
    )::int as contribution_score
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  LEFT JOIN (
    SELECT created_by as user_id, COUNT(*) as count
    FROM pins
    WHERE created_at >= NOW() - INTERVAL '90 days'
    GROUP BY created_by
  ) pin_count ON u.id = pin_count.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM pin_posts
    WHERE created_at >= NOW() - INTERVAL '90 days'
    GROUP BY user_id
  ) post_count ON u.id = post_count.user_id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as count
    FROM pin_votes
    WHERE created_at >= NOW() - INTERVAL '90 days'
    GROUP BY user_id
  ) vote_count ON u.id = vote_count.user_id
  LEFT JOIN (
    SELECT contributor_user_id as user_id, COUNT(*) as count
    FROM fund_transactions
    WHERE created_at >= NOW() - INTERVAL '90 days'
      AND transaction_type = 'contribution'
      AND status = 'completed'
    GROUP BY contributor_user_id
  ) fund_count ON u.id = fund_count.user_id
  WHERE (
    COALESCE(pin_count.count, 0) +
    COALESCE(post_count.count, 0) +
    COALESCE(vote_count.count, 0) +
    COALESCE(fund_count.count, 0)
  ) > 0
  ORDER BY contribution_score DESC
  LIMIT limit_count;
$$;

-- Function to get community health metrics
CREATE OR REPLACE FUNCTION get_community_health_metrics()
RETURNS TABLE (
  active_users float,
  engagement_rate float,
  content_quality float,
  response_time float,
  fund_participation float
)
LANGUAGE sql STABLE
AS $$
  WITH metrics AS (
    SELECT
      -- Active users (users who posted/voted in last 30 days)
      (SELECT COUNT(DISTINCT user_id) FROM (
        SELECT created_by as user_id FROM pins WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION
        SELECT user_id FROM pin_posts WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION
        SELECT user_id FROM pin_votes WHERE created_at >= NOW() - INTERVAL '30 days'
      ) active)::float / GREATEST((SELECT COUNT(*) FROM auth.users), 1) * 100 as active_users,

      -- Engagement rate (posts per pin)
      (SELECT COUNT(*) FROM pin_posts WHERE created_at >= NOW() - INTERVAL '30 days')::float /
      GREATEST((SELECT COUNT(*) FROM pins WHERE created_at >= NOW() - INTERVAL '30 days'), 1) * 20 as engagement_rate,

      -- Content quality (non-flagged content percentage)
      (SELECT COUNT(*) FROM pin_posts WHERE is_flagged = false)::float /
      GREATEST((SELECT COUNT(*) FROM pin_posts), 1) * 100 as content_quality,

      -- Response time (average hours to first response)
      GREATEST(100 - (
        SELECT AVG(EXTRACT(EPOCH FROM (first_response.created_at - pins.created_at)) / 3600)
        FROM pins
        LEFT JOIN (
          SELECT DISTINCT ON (pin_id) pin_id, created_at
          FROM pin_posts
          ORDER BY pin_id, created_at
        ) first_response ON pins.id = first_response.pin_id
        WHERE pins.created_at >= NOW() - INTERVAL '30 days'
          AND first_response.created_at IS NOT NULL
      ), 0) as response_time,

      -- Fund participation (users who contributed)
      (SELECT COUNT(DISTINCT contributor_user_id) FROM fund_transactions
       WHERE transaction_type = 'contribution' AND status = 'completed')::float /
      GREATEST((SELECT COUNT(*) FROM auth.users), 1) * 100 as fund_participation
  )
  SELECT * FROM metrics;
$$;
