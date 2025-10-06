-- SILAS Platform Database Schema
-- Run this SQL in your Supabase SQL editor

-- Enable PostGIS for geographical operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table for future authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'community_member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pins table for map features
CREATE TABLE IF NOT EXISTS pins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    layer TEXT NOT NULL, -- Faith, Economy, Works, Circle, Mind, Pulse, Commerce
    tags TEXT,
    coordinates POINT NOT NULL, -- PostGIS point type
    created_by TEXT DEFAULT 'anonymous',
    status TEXT DEFAULT 'active', -- active, inactive, archived
    metadata JSONB, -- Flexible storage for layer-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table for likes, reactions, votes
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- like, love, amen, endorse, vote_yes, vote_no, vote_abstain
    user_id TEXT DEFAULT 'anonymous',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table for discussions
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    user_id TEXT DEFAULT 'anonymous',
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threaded comments
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table for community feed and tracking
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- pin_created, comment_added, feedback_given, project_joined, etc.
    data JSONB, -- Flexible data storage
    user_id TEXT DEFAULT 'anonymous',
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table for Works layer tracking
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    goal_amount DECIMAL,
    current_amount DECIMAL DEFAULT 0,
    volunteers_needed INTEGER,
    volunteers_current INTEGER DEFAULT 0,
    deadline DATE,
    status TEXT DEFAULT 'active', -- active, completed, paused, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proposals table for Circle layer governance
CREATE TABLE IF NOT EXISTS proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
    proposal_text TEXT NOT NULL,
    voting_deadline TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft', -- draft, active, closed, implemented
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data points table for Pulse layer KPIs
CREATE TABLE IF NOT EXISTS data_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pin_id UUID REFERENCES pins(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    value DECIMAL NOT NULL,
    unit TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pins_layer ON pins(layer);
CREATE INDEX IF NOT EXISTS idx_pins_coordinates ON pins USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_pins_status ON pins(status);
CREATE INDEX IF NOT EXISTS idx_feedback_pin_id ON feedback(pin_id);
CREATE INDEX IF NOT EXISTS idx_comments_pin_id ON comments(pin_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);

-- Row Level Security (RLS) policies
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated and anonymous users
CREATE POLICY "Allow read access to pins" ON pins FOR SELECT USING (true);
CREATE POLICY "Allow read access to feedback" ON feedback FOR SELECT USING (true);
CREATE POLICY "Allow read access to comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow read access to activities" ON activities FOR SELECT USING (true);

-- Allow insert for authenticated and anonymous users (for now)
CREATE POLICY "Allow insert pins" ON pins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert activities" ON activities FOR INSERT WITH CHECK (true);

-- Allow update for own records (placeholder for future auth)
CREATE POLICY "Allow update own pins" ON pins FOR UPDATE USING (created_by = current_setting('request.jwt.claims', true)::json->>'sub');

-- Sample data for testing
INSERT INTO pins (name, description, layer, tags, coordinates) VALUES
('St. Mary''s Church', 'Historic parish church with Sunday services at 10am', 'Faith', 'church,community,historic', ST_MakePoint(-2.3775, 53.5550)::point),
('Green Valley Farm Shop', 'Local organic produce and artisan goods', 'Commerce', 'organic,local,shopping', ST_MakePoint(-2.3760, 53.5535)::point),
('Community Garden Project', 'Collaborative growing space for all residents', 'Works', 'gardening,community,environment', ST_MakePoint(-2.3785, 53.5565)::point),
('Traffic Calming Proposal', 'Vote on speed reduction measures for School Lane', 'Circle', 'governance,traffic,safety', ST_MakePoint(-2.3750, 53.5545)::point),
('Local History Archive', 'Digital preservation of community memories', 'Mind', 'history,education,archive', ST_MakePoint(-2.3770, 53.5555)::point),
('Air Quality Monitor', 'Real-time environmental data tracking', 'Pulse', 'environment,data,monitoring', ST_MakePoint(-2.3780, 53.5560)::point);

-- Add some sample feedback and comments
INSERT INTO feedback (pin_id, type) 
SELECT id, 'like' FROM pins WHERE name = 'St. Mary''s Church';

INSERT INTO comments (pin_id, text)
SELECT id, 'Great initiative for the community!' FROM pins WHERE name = 'Community Garden Project';

-- Function to get pins as GeoJSON (useful for map integration)
CREATE OR REPLACE FUNCTION get_pins_geojson(layer_filter TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  WITH pin_features AS (
    SELECT 
      json_build_object(
        'type', 'Feature',
        'id', id,
        'properties', json_build_object(
          'id', id,
          'name', name,
          'description', description,
          'layer', layer,
          'tags', tags,
          'created_by', created_by,
          'status', status,
          'created_at', created_at,
          'reactions', (SELECT COUNT(*) FROM feedback WHERE pin_id = pins.id),
          'comments', (SELECT COUNT(*) FROM comments WHERE pin_id = pins.id)
        ),
        'geometry', ST_AsGeoJSON(coordinates)::json
      ) as feature
    FROM pins
    WHERE status = 'active'
      AND (layer_filter IS NULL OR layer = layer_filter)
  )
  SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(feature)
  ) INTO result
  FROM pin_features;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;