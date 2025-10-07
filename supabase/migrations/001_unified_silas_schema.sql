-- SILAS Unified Database Schema v3.0
-- Comprehensive schema for community intelligence platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================
-- CORE CATEGORY FRAMEWORK (8 Categories)
-- =============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7), -- Hex color code
  parent_id UUID REFERENCES categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the 8 core SILAS categories
INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES
('Faith & Fellowship', 'faith', 'Strengthen spiritual life, local parishes, and moral resilience', 'Church', '#8B5CF6', 1),
('Projects & Infrastructure', 'projects', 'Build resilient infrastructure and sustainable community projects', 'Hammer', '#F59E0B', 2),
('Economy & Commerce', 'economy', 'Foster local economy, entrepreneurship, and sustainable business', 'Briefcase', '#10B981', 3),
('Environment & Sustainability', 'environment', 'Protect and enhance our natural environment', 'Leaf', '#059669', 4),
('Community & Social', 'community', 'Strengthen social bonds and community connections', 'Users', '#EF4444', 5),
('Heritage & Culture', 'heritage', 'Preserve and celebrate local history and traditions', 'BookOpen', '#7C3AED', 6),
('Wellbeing & Health', 'wellbeing', 'Promote physical and mental health for all', 'Heart', '#EC4899', 7),
('Governance & Civic', 'governance', 'Democratic participation and transparent decision-making', 'Scale', '#3B82F6', 8);

-- =============================================
-- UNIFIED PINS SYSTEM
-- =============================================

CREATE TABLE pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id),
  subcategory VARCHAR(100),
  pin_type VARCHAR(100),
  
  -- Geospatial data
  geom GEOMETRY(POINT, 4326) NOT NULL,
  address TEXT,
  postcode VARCHAR(10),
  
  -- Status and visibility
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'flagged')),
  social_visibility VARCHAR(20) DEFAULT 'public' CHECK (social_visibility IN ('public', 'members', 'private')),
  is_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  tags TEXT[], -- Array of tags
  metadata JSONB DEFAULT '{}',
  
  -- Fund eligibility
  fund_eligible BOOLEAN DEFAULT false,
  fund_requested_amount DECIMAL(10,2),
  fund_approved_amount DECIMAL(10,2),
  
  -- Ownership and timestamps
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create spatial index for pins
CREATE INDEX idx_pins_geom ON pins USING GIST (geom);
CREATE INDEX idx_pins_category ON pins (category_id);
CREATE INDEX idx_pins_status ON pins (status);
CREATE INDEX idx_pins_created_at ON pins (created_at DESC);

-- =============================================
-- PROJECTS SYSTEM
-- =============================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Project details
  project_type VARCHAR(50),
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'funding', 'active', 'completed', 'cancelled')),
  
  -- Financial tracking
  budget_total DECIMAL(12,2),
  budget_raised DECIMAL(12,2) DEFAULT 0,
  fund_allocation DECIMAL(12,2) DEFAULT 0,
  
  -- Timeline
  start_date DATE,
  target_completion DATE,
  actual_completion DATE,
  
  -- Community engagement
  volunteer_count INTEGER DEFAULT 0,
  supporter_count INTEGER DEFAULT 0,
  
  -- Metadata
  milestones JSONB DEFAULT '[]',
  resources_needed TEXT[],
  skills_needed TEXT[],
  
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SOCIAL INTERACTION SYSTEM
-- =============================================

CREATE TABLE pin_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'support', 'pray', 'celebrate', 'concern')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pin_id, user_id, reaction_type)
);

CREATE TABLE pin_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES pin_comments(id), -- For threaded comments
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pin_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pin_id UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_type VARCHAR(20) DEFAULT 'link' CHECK (share_type IN ('link', 'social', 'email')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COMMUNITY FUND SYSTEM
-- =============================================

CREATE TABLE fund_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('contribution', 'allocation', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  
  -- Source tracking
  source_type VARCHAR(20) CHECK (source_type IN ('subscription', 'donation', 'grant', 'allocation')),
  source_reference VARCHAR(255), -- Stripe payment ID, etc.
  
  -- Allocation tracking
  project_id UUID REFERENCES projects(id),
  allocated_by UUID REFERENCES auth.users(id),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- VOTING & POLLS SYSTEM
-- =============================================

CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  poll_type VARCHAR(20) DEFAULT 'single' CHECK (poll_type IN ('single', 'multiple', 'ranked')),
  
  -- Scope
  pin_id UUID REFERENCES pins(id),
  project_id UUID REFERENCES projects(id),
  category_id UUID REFERENCES categories(id),
  
  -- Timing
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  is_anonymous BOOLEAN DEFAULT false,
  requires_verification BOOLEAN DEFAULT true,
  max_votes_per_user INTEGER DEFAULT 1,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'cancelled')),
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  option_order INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rank_order INTEGER, -- For ranked choice voting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id, option_id)
);

-- =============================================
-- EVENTS SYSTEM
-- =============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Location
  pin_id UUID REFERENCES pins(id),
  location_name VARCHAR(255),
  geom GEOMETRY(POINT, 4326),
  
  -- Timing
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- RRULE or custom pattern
  
  -- Event details
  event_type VARCHAR(50),
  category_id UUID REFERENCES categories(id),
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  
  -- Visibility and access
  is_public BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT false,
  registration_fee DECIMAL(8,2) DEFAULT 0,
  
  -- Metadata
  tags TEXT[],
  external_url VARCHAR(500),
  contact_info JSONB,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AI KNOWLEDGE SYSTEM
-- =============================================

CREATE TABLE ai_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text',
  
  -- Source tracking
  source_type VARCHAR(50) CHECK (source_type IN ('pin', 'project', 'event', 'comment', 'manual')),
  source_id UUID, -- References the source record
  
  -- Vector embedding for RAG
  embedding vector(384), -- Adjust dimension based on model
  
  -- Metadata
  tags TEXT[],
  category_id UUID REFERENCES categories(id),
  is_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector similarity search index
CREATE INDEX ON ai_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =============================================
-- USER PROFILES & ROLES
-- =============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  
  -- Role and verification
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('guest', 'user', 'doer', 'business', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  verification_type VARCHAR(50),
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{}',
  privacy_settings JSONB DEFAULT '{}',
  
  -- Location (optional)
  location_geom GEOMETRY(POINT, 4326),
  location_name VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_pins_updated_at BEFORE UPDATE ON pins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
