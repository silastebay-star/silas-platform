-- GeoJSON Integration System
-- Census data overlays, community boundaries, and geographic data visualization

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Census Data Table
CREATE TABLE IF NOT EXISTS census_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE, -- ONS area code
  population INTEGER NOT NULL DEFAULT 0,
  households INTEGER NOT NULL DEFAULT 0,
  median_age DECIMAL(4,1) DEFAULT 0,
  median_income INTEGER DEFAULT 0,
  unemployment_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Education levels (percentages)
  education_level JSONB DEFAULT '{
    "no_qualifications": 0,
    "level_1_qualifications": 0,
    "level_2_qualifications": 0,
    "apprenticeship": 0,
    "level_3_qualifications": 0,
    "level_4_qualifications_and_above": 0,
    "other_qualifications": 0
  }'::jsonb,
  
  -- Housing tenure (percentages)
  housing JSONB DEFAULT '{
    "owned_outright": 0,
    "owned_with_mortgage": 0,
    "shared_ownership": 0,
    "social_rented": 0,
    "private_rented": 0,
    "rent_free": 0
  }'::jsonb,
  
  -- Transport to work (percentages)
  transport JSONB DEFAULT '{
    "work_from_home": 0,
    "underground_metro": 0,
    "train": 0,
    "bus": 0,
    "taxi": 0,
    "motorcycle": 0,
    "car_driver": 0,
    "car_passenger": 0,
    "bicycle": 0,
    "on_foot": 0,
    "other": 0
  }'::jsonb,
  
  -- Geometry (polygon for census areas)
  geom GEOMETRY(POLYGON, 4326) NOT NULL,
  
  -- Metadata for additional census fields
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Boundaries Table
CREATE TABLE IF NOT EXISTS community_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ward', 'parish', 'constituency', 'local_authority', 'custom')),
  description TEXT,
  population INTEGER,
  area_hectares DECIMAL(10,2),
  
  -- Geometry (polygon or multipolygon)
  geom GEOMETRY(GEOMETRY, 4326) NOT NULL,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geographic Layers Table
CREATE TABLE IF NOT EXISTS geographic_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('census', 'boundary', 'infrastructure', 'environment', 'transport')),
  source_url TEXT,
  data_source TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  visible BOOLEAN DEFAULT true,
  opacity DECIMAL(3,2) DEFAULT 0.7 CHECK (opacity >= 0 AND opacity <= 1),
  color_scheme TEXT DEFAULT 'viridis',
  
  -- GeoJSON data
  geom JSONB NOT NULL,
  
  -- Layer configuration and metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Points of Interest Table
CREATE TABLE IF NOT EXISTS points_of_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  address TEXT,
  website TEXT,
  phone TEXT,
  opening_hours JSONB,
  
  -- Point geometry
  geom GEOMETRY(POINT, 4326) NOT NULL,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial indexes for performance
CREATE INDEX IF NOT EXISTS idx_census_data_geom ON census_data USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_community_boundaries_geom ON community_boundaries USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_points_of_interest_geom ON points_of_interest USING GIST (geom);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_census_data_population ON census_data (population);
CREATE INDEX IF NOT EXISTS idx_community_boundaries_type ON community_boundaries (type);
CREATE INDEX IF NOT EXISTS idx_geographic_layers_type ON geographic_layers (type);
CREATE INDEX IF NOT EXISTS idx_geographic_layers_visible ON geographic_layers (visible);
CREATE INDEX IF NOT EXISTS idx_points_of_interest_category ON points_of_interest (category);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_census_data_updated_at BEFORE UPDATE ON census_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_boundaries_updated_at BEFORE UPDATE ON community_boundaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geographic_layers_updated_at BEFORE UPDATE ON geographic_layers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_points_of_interest_updated_at BEFORE UPDATE ON points_of_interest FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE census_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE geographic_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest ENABLE ROW LEVEL SECURITY;

-- Public read access for census data and boundaries
CREATE POLICY "Public read access for census data" ON census_data FOR SELECT USING (true);
CREATE POLICY "Public read access for community boundaries" ON community_boundaries FOR SELECT USING (true);
CREATE POLICY "Public read access for visible geographic layers" ON geographic_layers FOR SELECT USING (visible = true);
CREATE POLICY "Public read access for points of interest" ON points_of_interest FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admin write access for census data" ON census_data FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admin write access for community boundaries" ON community_boundaries FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admin write access for geographic layers" ON geographic_layers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admin write access for points of interest" ON points_of_interest FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Functions for spatial queries

-- Function to get census data within bounds
CREATE OR REPLACE FUNCTION get_census_data_within_bounds(
  north DECIMAL,
  south DECIMAL,
  east DECIMAL,
  west DECIMAL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  population INTEGER,
  households INTEGER,
  median_age DECIMAL,
  median_income INTEGER,
  unemployment_rate DECIMAL,
  education_level JSONB,
  housing JSONB,
  transport JSONB,
  geom_geojson JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id,
    cd.name,
    cd.population,
    cd.households,
    cd.median_age,
    cd.median_income,
    cd.unemployment_rate,
    cd.education_level,
    cd.housing,
    cd.transport,
    ST_AsGeoJSON(cd.geom)::JSONB as geom_geojson
  FROM census_data cd
  WHERE ST_Intersects(
    cd.geom,
    ST_MakeEnvelope(west, south, east, north, 4326)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if point is within community boundary
CREATE OR REPLACE FUNCTION is_point_in_community_boundary(
  longitude DECIMAL,
  latitude DECIMAL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM community_boundaries 
    WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get nearest census area for a point
CREATE OR REPLACE FUNCTION get_nearest_census_area(
  longitude DECIMAL,
  latitude DECIMAL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id,
    cd.name,
    ST_Distance(cd.geom::geography, ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) as distance_meters
  FROM census_data cd
  ORDER BY cd.geom <-> ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_census_data_within_bounds TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_point_in_community_boundary TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_nearest_census_area TO authenticated, anon;
