-- Migration: Add missing module tables for fund, economy, environment, events, and AI
-- Created: 2025-01-07

-- ============================================================================
-- COMMUNITY FUND TABLES
-- ============================================================================

-- Fund balance tracking
CREATE TABLE IF NOT EXISTS fund_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_balance decimal(12,2) DEFAULT 0,
  available_balance decimal(12,2) DEFAULT 0,
  committed_balance decimal(12,2) DEFAULT 0,
  monthly_contributions decimal(12,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Fund proposals
CREATE TABLE IF NOT EXISTS fund_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  amount_requested decimal(12,2) NOT NULL,
  category text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'approved', 'rejected', 'completed')),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  voting_deadline timestamptz,
  votes_for integer DEFAULT 0,
  votes_against integer DEFAULT 0,
  total_votes integer DEFAULT 0,
  funding_goal decimal(12,2) DEFAULT 0,
  current_funding decimal(12,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  pin_id uuid REFERENCES pins(id) ON DELETE SET NULL
);

-- Fund votes
CREATE TABLE IF NOT EXISTS fund_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES fund_proposals(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('for', 'against', 'abstain')),
  weight integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  comment text,
  UNIQUE(proposal_id, user_id)
);

-- Fund transactions
CREATE TABLE IF NOT EXISTS fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES fund_proposals(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('contribution', 'disbursement', 'refund')),
  description text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fund_proposals_status ON fund_proposals(status);
CREATE INDEX IF NOT EXISTS idx_fund_proposals_category ON fund_proposals(category);
CREATE INDEX IF NOT EXISTS idx_fund_proposals_created_by ON fund_proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_fund_proposals_pin_id ON fund_proposals(pin_id);
CREATE INDEX IF NOT EXISTS idx_fund_votes_proposal_id ON fund_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_fund_votes_user_id ON fund_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_proposal_id ON fund_transactions(proposal_id);

-- Create function to get fund metrics
CREATE OR REPLACE FUNCTION get_fund_metrics()
RETURNS TABLE (
  total_proposals INTEGER,
  active_proposals INTEGER,
  approved_proposals INTEGER,
  total_funding_requested DECIMAL(12,2),
  total_funding_approved DECIMAL(12,2),
  average_proposal_amount DECIMAL(12,2),
  success_rate DECIMAL(5,2),
  community_participation INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_proposals,
    COUNT(*) FILTER (WHERE status = 'active')::INTEGER as active_proposals,
    COUNT(*) FILTER (WHERE status = 'approved')::INTEGER as approved_proposals,
    COALESCE(SUM(amount_requested), 0) as total_funding_requested,
    COALESCE(SUM(amount_requested) FILTER (WHERE status = 'approved'), 0) as total_funding_approved,
    COALESCE(AVG(amount_requested), 0) as average_proposal_amount,
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE status = 'approved')::DECIMAL / COUNT(*)::DECIMAL * 100)
      ELSE 0
    END as success_rate,
    (SELECT COUNT(DISTINCT created_by) FROM fund_proposals)::INTEGER as community_participation
  FROM fund_proposals;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- LOCAL ECONOMY TABLES
-- ============================================================================

-- Local businesses
CREATE TABLE IF NOT EXISTS local_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  subcategory text,
  address text NOT NULL,
  contact_email text,
  contact_phone text,
  website text,
  social_media jsonb DEFAULT '{}',
  opening_hours jsonb DEFAULT '{}',
  location point NOT NULL,
  latitude decimal(10,8),
  longitude decimal(11,8),
  verified boolean DEFAULT false,
  rating decimal(2,1) DEFAULT 0,
  review_count integer DEFAULT 0,
  price_range text CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  features text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  pin_id uuid REFERENCES pins(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'
);

-- Business categories
CREATE TABLE IF NOT EXISTS business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text DEFAULT '#3B82F6',
  parent_category_id uuid REFERENCES business_categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Business reviews
CREATE TABLE IF NOT EXISTS business_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES local_businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  content text,
  images text[] DEFAULT '{}',
  helpful_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Marketplace items
CREATE TABLE IF NOT EXISTS marketplace_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES local_businesses(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  price decimal(10,2),
  currency text DEFAULT 'GBP',
  condition text CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
  images text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  status text DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved', 'inactive')),
  location text,
  delivery_options text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Economic metrics
CREATE TABLE IF NOT EXISTS economic_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  value decimal(12,2) NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  location text,
  category text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Economic indicators (aggregated data)
CREATE TABLE IF NOT EXISTS economic_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_businesses integer DEFAULT 0,
  new_businesses_this_month integer DEFAULT 0,
  local_spending decimal(12,2) DEFAULT 0,
  economic_diversity_index decimal(3,2) DEFAULT 0,
  employment_rate decimal(3,2) DEFAULT 0,
  average_business_rating decimal(2,1) DEFAULT 0,
  total_marketplace_items integer DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insert default business categories
INSERT INTO business_categories (name, description, icon, color) VALUES
  ('Restaurants & Food', 'Dining, cafes, food trucks, and catering', '🍽️', '#F59E0B'),
  ('Retail & Shopping', 'Stores, boutiques, and specialty shops', '🛍️', '#3B82F6'),
  ('Services', 'Professional and personal services', '🔧', '#10B981'),
  ('Health & Wellness', 'Healthcare, fitness, and wellness services', '🏥', '#EF4444'),
  ('Arts & Entertainment', 'Galleries, theaters, and entertainment venues', '🎨', '#8B5CF6'),
  ('Education & Learning', 'Schools, tutoring, and educational services', '📚', '#7C3AED'),
  ('Technology', 'IT services, tech support, and digital services', '💻', '#06B6D4'),
  ('Home & Garden', 'Home improvement, landscaping, and maintenance', '🏠', '#059669'),
  ('Automotive', 'Car services, repairs, and automotive supplies', '🚗', '#DC2626'),
  ('Beauty & Personal Care', 'Salons, spas, and personal care services', '💄', '#EC4899')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ENVIRONMENT TABLES
-- ============================================================================

-- Environmental metrics
CREATE TABLE IF NOT EXISTS environmental_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  value decimal(10,2) NOT NULL,
  unit text NOT NULL,
  location point,
  latitude decimal(10,8),
  longitude decimal(11,8),
  recorded_at timestamptz DEFAULT now(),
  source text,
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  verified boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'
);

-- Environmental categories
CREATE TABLE IF NOT EXISTS environmental_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  icon text,
  color text DEFAULT '#059669',
  unit text,
  target_value decimal(10,2),
  target_direction text CHECK (target_direction IN ('increase', 'decrease', 'maintain')),
  created_at timestamptz DEFAULT now()
);

-- Sustainability projects
CREATE TABLE IF NOT EXISTS sustainability_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled', 'on_hold')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  start_date date,
  end_date date,
  budget decimal(10,2),
  funding_source text,
  location point,
  latitude decimal(10,8),
  longitude decimal(11,8),
  impact_metrics jsonb DEFAULT '{}',
  participants_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  pin_id uuid REFERENCES pins(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'
);

-- Project participants
CREATE TABLE IF NOT EXISTS project_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES sustainability_projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'participant' CHECK (role IN ('participant', 'volunteer', 'coordinator', 'leader')),
  joined_at timestamptz DEFAULT now(),
  contribution_hours decimal(5,2) DEFAULT 0,
  notes text,
  UNIQUE(project_id, user_id)
);

-- Green initiatives
CREATE TABLE IF NOT EXISTS green_initiatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  proposed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'under_review', 'approved', 'rejected', 'implemented')),
  votes_for integer DEFAULT 0,
  votes_against integer DEFAULT 0,
  implementation_cost decimal(10,2),
  expected_impact text,
  timeline_months integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Initiative votes
CREATE TABLE IF NOT EXISTS initiative_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id uuid REFERENCES green_initiatives(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  vote text NOT NULL CHECK (vote IN ('for', 'against', 'abstain')),
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(initiative_id, user_id)
);

-- Environmental alerts
CREATE TABLE IF NOT EXISTS environmental_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text NOT NULL,
  location point,
  latitude decimal(10,8),
  longitude decimal(11,8),
  metric_value decimal(10,2),
  threshold_value decimal(10,2),
  status text DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'
);

-- Insert default environmental categories
INSERT INTO environmental_categories (name, description, icon, color, unit, target_value, target_direction) VALUES
  ('Air Quality', 'Air pollution and quality measurements', '🌬️', '#06B6D4', 'AQI', 50, 'decrease'),
  ('Water Quality', 'Water pollution and quality indicators', '💧', '#3B82F6', 'pH', 7, 'maintain'),
  ('Energy Usage', 'Community energy consumption tracking', '⚡', '#F59E0B', 'kWh', 1000, 'decrease'),
  ('Waste Reduction', 'Waste generation and recycling metrics', '♻️', '#10B981', 'kg', 100, 'decrease'),
  ('Carbon Footprint', 'CO2 emissions and carbon tracking', '🌱', '#059669', 'tCO2e', 5, 'decrease'),
  ('Biodiversity', 'Local wildlife and ecosystem health', '🦋', '#8B5CF6', 'species', 50, 'increase'),
  ('Green Spaces', 'Parks, gardens, and green area coverage', '🌳', '#22C55E', 'm²', 1000, 'increase'),
  ('Renewable Energy', 'Solar, wind, and renewable energy usage', '☀️', '#EAB308', '%', 80, 'increase'),
  ('Transportation', 'Sustainable transport and emissions', '🚲', '#6366F1', 'km', 10, 'increase'),
  ('Noise Pollution', 'Environmental noise level monitoring', '🔇', '#EF4444', 'dB', 55, 'decrease')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- EVENTS TABLES
-- ============================================================================

-- Community events
CREATE TABLE IF NOT EXISTS community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  location text NOT NULL,
  location_coords point,
  max_attendees integer,
  current_attendees integer DEFAULT 0,
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb DEFAULT '{}',
  parent_event_id uuid REFERENCES community_events(id) ON DELETE CASCADE,
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'cancelled', 'completed')),
  is_public boolean DEFAULT true,
  requires_approval boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  image_url text,
  contact_info jsonb DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  pin_id uuid REFERENCES pins(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES community_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'not_going')),
  guests_count integer DEFAULT 0,
  dietary_requirements text,
  accessibility_needs text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Event categories
CREATE TABLE IF NOT EXISTS event_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#3B82F6',
  icon text,
  created_at timestamptz DEFAULT now()
);

-- Event comments
CREATE TABLE IF NOT EXISTS event_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES community_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES event_comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for events
CREATE INDEX IF NOT EXISTS idx_community_events_start_time ON community_events(start_time);
CREATE INDEX IF NOT EXISTS idx_community_events_category ON community_events(category);
CREATE INDEX IF NOT EXISTS idx_community_events_created_by ON community_events(created_by);
CREATE INDEX IF NOT EXISTS idx_community_events_status ON community_events(status);
CREATE INDEX IF NOT EXISTS idx_community_events_pin_id ON community_events(pin_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON event_comments(event_id);

-- Insert default event categories
INSERT INTO event_categories (name, description, color, icon) VALUES
  ('Community Meeting', 'Regular community gatherings and town halls', '#3B82F6', '👥'),
  ('Workshop', 'Educational workshops and skill-sharing sessions', '#10B981', '🛠️'),
  ('Social Event', 'Social gatherings and community celebrations', '#F59E0B', '🎉'),
  ('Volunteer Work', 'Community service and volunteer opportunities', '#8B5CF6', '🤝'),
  ('Environment', 'Environmental and sustainability initiatives', '#059669', '🌱'),
  ('Arts & Culture', 'Cultural events, arts, and creative activities', '#DC2626', '🎨'),
  ('Sports & Recreation', 'Sports events and recreational activities', '#EA580C', '⚽'),
  ('Education', 'Educational events and learning opportunities', '#7C3AED', '📚')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- AI COPILOT TABLES
-- ============================================================================

-- AI conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  context_type text, -- 'general', 'fund', 'events', 'economy', 'environment'
  context_id uuid, -- Reference to specific entity if applicable
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  message_count integer DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- AI messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  model_used text,
  response_time_ms integer,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Community insights
CREATE TABLE IF NOT EXISTS community_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type text NOT NULL, -- 'trend', 'recommendation', 'alert', 'summary'
  category text NOT NULL, -- 'fund', 'events', 'economy', 'environment', 'community'
  title text NOT NULL,
  description text NOT NULL,
  data jsonb NOT NULL,
  confidence_score decimal(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'acted_upon')),
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  viewed_by uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'
);

-- AI recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL, -- 'event', 'business', 'proposal', 'project', 'action'
  target_id uuid, -- ID of the recommended entity
  target_type text, -- Type of the recommended entity
  title text NOT NULL,
  description text NOT NULL,
  reasoning text,
  confidence_score decimal(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  relevance_score decimal(3,2) CHECK (relevance_score >= 0 AND relevance_score <= 1),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'dismissed')),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- AI analytics
CREATE TABLE IF NOT EXISTS ai_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL, -- 'conversation_started', 'message_sent', 'insight_generated', 'recommendation_clicked'
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE SET NULL,
  insight_id uuid REFERENCES community_insights(id) ON DELETE SET NULL,
  recommendation_id uuid REFERENCES ai_recommendations(id) ON DELETE SET NULL,
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- AI knowledge base
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  source_type text, -- 'manual', 'community_data', 'external_api'
  source_id uuid,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Fund indexes
CREATE INDEX IF NOT EXISTS idx_fund_proposals_status ON fund_proposals(status);
CREATE INDEX IF NOT EXISTS idx_fund_proposals_created_by ON fund_proposals(created_by);
CREATE INDEX IF NOT EXISTS idx_fund_votes_proposal_id ON fund_votes(proposal_id);

-- Business indexes
CREATE INDEX IF NOT EXISTS idx_businesses_category ON local_businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON local_businesses USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON local_businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_verified ON local_businesses(verified);
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON local_businesses(rating);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON local_businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_pin_id ON local_businesses(pin_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_business_id ON business_reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_user_id ON business_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_business_reviews_rating ON business_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_business_id ON marketplace_items(business_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_seller_id ON marketplace_items(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_category ON marketplace_items(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_items_status ON marketplace_items(status);
CREATE INDEX IF NOT EXISTS idx_economic_metrics_type ON economic_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_economic_metrics_period ON economic_metrics(period_start, period_end);

-- Event indexes
CREATE INDEX IF NOT EXISTS idx_events_start_time ON community_events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_category ON community_events(category);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);

-- Environment indexes
CREATE INDEX IF NOT EXISTS idx_env_metrics_type ON environmental_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_env_metrics_recorded_at ON environmental_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_env_metrics_location ON environmental_metrics USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_env_metrics_verified ON environmental_metrics(verified);
CREATE INDEX IF NOT EXISTS idx_sustainability_projects_status ON sustainability_projects(status);
CREATE INDEX IF NOT EXISTS idx_sustainability_projects_category ON sustainability_projects(category);
CREATE INDEX IF NOT EXISTS idx_sustainability_projects_created_by ON sustainability_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_sustainability_projects_location ON sustainability_projects USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_sustainability_projects_pin_id ON sustainability_projects(pin_id);
CREATE INDEX IF NOT EXISTS idx_project_participants_project_id ON project_participants(project_id);
CREATE INDEX IF NOT EXISTS idx_project_participants_user_id ON project_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_green_initiatives_status ON green_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_green_initiatives_proposed_by ON green_initiatives(proposed_by);
CREATE INDEX IF NOT EXISTS idx_initiative_votes_initiative_id ON initiative_votes(initiative_id);
CREATE INDEX IF NOT EXISTS idx_initiative_votes_user_id ON initiative_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_environmental_alerts_severity ON environmental_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_environmental_alerts_status ON environmental_alerts(status);
CREATE INDEX IF NOT EXISTS idx_environmental_alerts_location ON environmental_alerts USING GIST(location);

-- AI indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context ON ai_conversations(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_community_insights_type ON community_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_community_insights_category ON community_insights(category);
CREATE INDEX IF NOT EXISTS idx_community_insights_status ON community_insights(status);
CREATE INDEX IF NOT EXISTS idx_community_insights_generated_at ON community_insights(generated_at);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_event_type ON ai_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_user_id ON ai_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_category ON ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_tags ON ai_knowledge_base USING GIN(tags);

-- AI indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE fund_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE environmental_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_insights ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later)
-- Allow read access to most tables for authenticated users
CREATE POLICY "Allow read access" ON fund_balance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access" ON fund_proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access" ON local_businesses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access" ON community_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access" ON community_insights FOR SELECT TO authenticated USING (true);

-- Allow users to manage their own data
CREATE POLICY "Users can manage own proposals" ON fund_proposals FOR ALL TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can manage own votes" ON fund_votes FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own RSVPs" ON event_rsvps FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own conversations" ON ai_conversations FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Insert initial fund balance record
INSERT INTO fund_balance (total_balance, available_balance, committed_balance, monthly_contributions)
VALUES (0, 0, 0, 0)
ON CONFLICT DO NOTHING;
