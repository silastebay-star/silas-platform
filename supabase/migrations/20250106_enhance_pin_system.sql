-- Enhanced Pin System Migration
-- Adds new features to existing pin system without breaking current functionality

-- Add new columns to existing pins table (if it exists)
DO $$
BEGIN
    -- Check if pins table exists and add metadata column if missing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pins') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pins' AND column_name = 'metadata') THEN
            ALTER TABLE pins ADD COLUMN metadata jsonb DEFAULT '{}';
        END IF;
    END IF;
END $$;

-- Create pin proposals table for moderation workflow
CREATE TABLE IF NOT EXISTS pin_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid REFERENCES pins(id) ON DELETE CASCADE, -- null if new pin proposal
  proposer_id text DEFAULT 'anonymous', -- Use text for now, can be upgraded to UUID later
  action text NOT NULL CHECK (action IN ('create', 'edit', 'delete', 'attach_photo')),
  payload jsonb NOT NULL, -- proposed fields and values
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id text DEFAULT 'admin',
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create block grid table for 3m x 3m spacing
CREATE TABLE IF NOT EXISTS pin_block_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id text DEFAULT 'stoneclough', -- Use text for now
  cell_x integer NOT NULL,
  cell_y integer NOT NULL,
  bucket jsonb DEFAULT '{}', -- metadata like reason, owner, expires_at
  created_at timestamptz DEFAULT now(),
  UNIQUE (community_id, cell_x, cell_y)
);

-- Create project pins table for multi-pin projects
CREATE TABLE IF NOT EXISTS project_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES pins(id) ON DELETE CASCADE, -- project is a pin with category='project'
  pin_id uuid REFERENCES pins(id) ON DELETE CASCADE, -- linked pins
  role text, -- e.g., 'site','depot','monitoring','staging'
  created_at timestamptz DEFAULT now(),
  UNIQUE(project_id, pin_id)
);

-- Create pin photos table
CREATE TABLE IF NOT EXISTS pin_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid REFERENCES pins(id) ON DELETE CASCADE,
  uploaded_by text DEFAULT 'anonymous',
  storage_path text NOT NULL, -- Supabase Storage key
  caption text CHECK (char_length(caption) <= 500),
  created_at timestamptz DEFAULT now(),
  approved boolean DEFAULT false
);

-- Create issue flags table for issue pins
CREATE TABLE IF NOT EXISTS issue_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id uuid REFERENCES pins(id) ON DELETE CASCADE,
  severity smallint DEFAULT 3 CHECK (severity BETWEEN 1 AND 5), -- 1-critical .. 5-low
  reported_by text DEFAULT 'anonymous',
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'dismissed')),
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pin_proposals_status ON pin_proposals (status);
CREATE INDEX IF NOT EXISTS idx_pin_proposals_community ON pin_proposals (community_id);
CREATE INDEX IF NOT EXISTS idx_pin_block_cells_community_coords ON pin_block_cells (community_id, cell_x, cell_y);
CREATE INDEX IF NOT EXISTS idx_project_pins_project ON project_pins (project_id);
CREATE INDEX IF NOT EXISTS idx_pin_photos_pin ON pin_photos (pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_photos_approved ON pin_photos (approved);
CREATE INDEX IF NOT EXISTS idx_issue_flags_pin ON issue_flags (pin_id);
CREATE INDEX IF NOT EXISTS idx_issue_flags_status ON issue_flags (status);

-- Helper function to compute grid cell coordinates
CREATE OR REPLACE FUNCTION compute_cell(lat double precision, lon double precision, cell_size_m double precision DEFAULT 3)
RETURNS TABLE(cell_x integer, cell_y integer) AS $$
DECLARE
  geom_m geometry;
  x double precision;
  y double precision;
BEGIN
  -- Project to Web Mercator (EPSG:3857) for meters approximation
  geom_m := ST_Transform(ST_SetSRID(ST_MakePoint(lon, lat), 4326), 3857);
  x := ST_X(geom_m);
  y := ST_Y(geom_m);
  cell_x := floor(x / cell_size_m)::integer;
  cell_y := floor(y / cell_size_m)::integer;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a cell is blocked
CREATE OR REPLACE FUNCTION is_cell_blocked(
  p_community_id uuid,
  p_cell_x integer,
  p_cell_y integer
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pin_block_cells 
    WHERE community_id = p_community_id 
    AND cell_x = p_cell_x 
    AND cell_y = p_cell_y
  );
END;
$$ LANGUAGE plpgsql STABLE;
