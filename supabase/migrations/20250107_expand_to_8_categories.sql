-- SILAS v3.0: Expand to 8-Category Framework
-- Add Heritage & Culture and Governance & Civic categories
-- Build on existing pin system and database structure

-- Add the new categories to match the updated framework
INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES
('Heritage & Culture', 'heritage', 'Preserve and celebrate local history and cultural traditions', 'BookOpen', '#7C3AED', 7),
('Governance & Civic', 'governance', 'Democratic participation and transparent community decision-making', 'Scale', '#3B82F6', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Update existing category names to match v3.0 framework
UPDATE categories SET 
  name = 'Projects & Infrastructure',
  description = 'Build resilient infrastructure and sustainable community projects'
WHERE slug = 'works';

UPDATE categories SET 
  name = 'Economy & Commerce',
  description = 'Foster local economy, entrepreneurship, and sustainable business'
WHERE slug = 'commerce';

UPDATE categories SET 
  name = 'Community & Social',
  description = 'Strengthen social bonds and community connections'
WHERE slug = 'circle';

UPDATE categories SET 
  name = 'Mind & Learning',
  description = 'Educational opportunities and knowledge sharing'
WHERE slug = 'mind';

UPDATE categories SET 
  name = 'Wellbeing & Health',
  description = 'Promote physical, mental, and social wellbeing for all community members'
WHERE slug = 'pulse';

-- Add subcategories for Heritage & Culture
INSERT INTO categories (name, slug, description, icon, color, parent_id, sort_order) VALUES
('Local History', 'heritage_history', 'Historical sites and community heritage', 'BookOpen', '#7C3AED', 
  (SELECT id FROM categories WHERE slug = 'heritage'), 1),
('Monuments & Landmarks', 'heritage_monuments', 'Historic buildings and landmarks', 'Building', '#8B5CF6',
  (SELECT id FROM categories WHERE slug = 'heritage'), 2),
('Cultural Traditions', 'heritage_traditions', 'Local customs and cultural practices', 'Palette', '#A78BFA',
  (SELECT id FROM categories WHERE slug = 'heritage'), 3),
('Arts & Crafts', 'heritage_arts', 'Local arts, crafts, and creative expression', 'Camera', '#C4B5FD',
  (SELECT id FROM categories WHERE slug = 'heritage'), 4),
('Community Stories', 'heritage_stories', 'Oral history and community narratives', 'MessageCircle', '#DDD6FE',
  (SELECT id FROM categories WHERE slug = 'heritage'), 5);

-- Add subcategories for Governance & Civic
INSERT INTO categories (name, slug, description, icon, color, parent_id, sort_order) VALUES
('Local Council', 'governance_council', 'Local government and council activities', 'Building', '#3B82F6',
  (SELECT id FROM categories WHERE slug = 'governance'), 1),
('Voting & Elections', 'governance_voting', 'Democratic processes and elections', 'Scale', '#60A5FA',
  (SELECT id FROM categories WHERE slug = 'governance'), 2),
('Planning & Development', 'governance_planning', 'Community planning and development projects', 'Hammer', '#93C5FD',
  (SELECT id FROM categories WHERE slug = 'governance'), 3),
('Transparency', 'governance_transparency', 'Open government and public information', 'BookOpen', '#BFDBFE',
  (SELECT id FROM categories WHERE slug = 'governance'), 4),
('Civic Participation', 'governance_participation', 'Community engagement and citizen involvement', 'Users', '#DBEAFE',
  (SELECT id FROM categories WHERE slug = 'governance'), 5);

-- Add new pin types for Heritage & Culture
INSERT INTO pin_types (name, category_id, description) VALUES
('Historical Sites', (SELECT id FROM categories WHERE slug = 'heritage'), 'Places of historical significance'),
('Museums', (SELECT id FROM categories WHERE slug = 'heritage'), 'Local museums and exhibitions'),
('Art Galleries', (SELECT id FROM categories WHERE slug = 'heritage'), 'Art galleries and creative spaces'),
('Cultural Centers', (SELECT id FROM categories WHERE slug = 'heritage'), 'Centers for cultural activities'),
('Heritage Trails', (SELECT id FROM categories WHERE slug = 'heritage'), 'Walking trails with historical significance'),
('Monuments', (SELECT id FROM categories WHERE slug = 'heritage'), 'Monuments and memorials'),
('Archives', (SELECT id FROM categories WHERE slug = 'heritage'), 'Historical archives and records'),
('Community Stories', (SELECT id FROM categories WHERE slug = 'heritage'), 'Places with community stories');

-- Add new pin types for Governance & Civic
INSERT INTO pin_types (name, category_id, description) VALUES
('Council Offices', (SELECT id FROM categories WHERE slug = 'governance'), 'Local government offices'),
('Polling Stations', (SELECT id FROM categories WHERE slug = 'governance'), 'Voting and election locations'),
('Public Meetings', (SELECT id FROM categories WHERE slug = 'governance'), 'Public meeting venues'),
('Planning Applications', (SELECT id FROM categories WHERE slug = 'governance'), 'Development planning sites'),
('Civic Centers', (SELECT id FROM categories WHERE slug = 'governance'), 'Centers for civic activities'),
('Public Consultations', (SELECT id FROM categories WHERE slug = 'governance'), 'Public consultation venues'),
('Community Forums', (SELECT id FROM categories WHERE slug = 'governance'), 'Community discussion spaces'),
('Transparency Boards', (SELECT id FROM categories WHERE slug = 'governance'), 'Public information displays');

-- Create table for pin types if it doesn't exist
CREATE TABLE IF NOT EXISTS pin_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  category_id UUID REFERENCES categories(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_pin_types_category_id ON pin_types(category_id);

-- Update any existing pins to use the new category structure
-- This is safe as it only updates the category references
UPDATE pins SET 
  category_id = (SELECT id FROM categories WHERE slug = 'projects')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'works');

UPDATE pins SET 
  category_id = (SELECT id FROM categories WHERE slug = 'economy')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'commerce');

UPDATE pins SET 
  category_id = (SELECT id FROM categories WHERE slug = 'community')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'circle');

UPDATE pins SET 
  category_id = (SELECT id FROM categories WHERE slug = 'wellbeing')
WHERE category_id = (SELECT id FROM categories WHERE slug = 'pulse');

-- Add sample heritage pins for Stoneclough
INSERT INTO pins (name, description, category_id, pin_type, geom, status, social_visibility, created_by) VALUES
('Stoneclough War Memorial', 'Memorial commemorating local residents who served in both World Wars', 
  (SELECT id FROM categories WHERE slug = 'heritage'), 'Monuments', 
  ST_SetSRID(ST_MakePoint(-2.3775, 53.5535), 4326), 'active', 'public', 
  (SELECT id FROM auth.users LIMIT 1)),

('Old Parish Records Archive', 'Historical parish records dating back to the 1800s, housed in the church vestry',
  (SELECT id FROM categories WHERE slug = 'heritage'), 'Archives',
  ST_SetSRID(ST_MakePoint(-2.3770, 53.5530), 4326), 'active', 'public',
  (SELECT id FROM auth.users LIMIT 1)),

('Stoneclough Heritage Trail', 'Self-guided walking trail highlighting key historical sites in the village',
  (SELECT id FROM categories WHERE slug = 'heritage'), 'Heritage Trails',
  ST_SetSRID(ST_MakePoint(-2.3765, 53.5525), 4326), 'active', 'public',
  (SELECT id FROM auth.users LIMIT 1));

-- Add sample governance pins for Stoneclough  
INSERT INTO pins (name, description, category_id, pin_type, geom, status, social_visibility, created_by) VALUES
('Parish Council Office', 'Stoneclough Parish Council offices and meeting rooms',
  (SELECT id FROM categories WHERE slug = 'governance'), 'Council Offices',
  ST_SetSRID(ST_MakePoint(-2.3772, 53.5528), 4326), 'active', 'public',
  (SELECT id FROM auth.users LIMIT 1)),

('Community Polling Station', 'Local polling station for elections and community votes',
  (SELECT id FROM categories WHERE slug = 'governance'), 'Polling Stations',
  ST_SetSRID(ST_MakePoint(-2.3768, 53.5526), 4326), 'active', 'public',
  (SELECT id FROM auth.users LIMIT 1)),

('Public Notice Board', 'Community notice board for council announcements and public information',
  (SELECT id FROM categories WHERE slug = 'governance'), 'Transparency Boards',
  ST_SetSRID(ST_MakePoint(-2.3770, 53.5527), 4326), 'active', 'public',
  (SELECT id FROM auth.users LIMIT 1));

-- Add metadata to track framework version
INSERT INTO system_metadata (key, value, description) VALUES
('category_framework_version', '3.0', 'SILAS Category Framework version')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Create system_metadata table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_metadata (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
