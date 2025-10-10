-- Spatial Functions for Pin Queries
-- PostGIS functions for location-based pin searches

-- Function to find pins within a radius
CREATE OR REPLACE FUNCTION pins_within_radius(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_km FLOAT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category pin_category,
  status pin_status,
  location GEOGRAPHY,
  address TEXT,
  images TEXT[],
  tags TEXT[],
  metadata JSONB,
  like_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  is_featured BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  group_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.status,
    p.location,
    p.address,
    p.images,
    p.tags,
    p.metadata,
    p.like_count,
    p.comment_count,
    p.view_count,
    p.is_featured,
    p.expires_at,
    p.created_by,
    p.group_id,
    p.created_at,
    p.updated_at,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
    ) / 1000 AS distance_km
  FROM public.pins p
  WHERE ST_DWithin(
    p.location,
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326),
    radius_km * 1000
  )
  AND p.status = 'active'
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to get pins within a bounding box
CREATE OR REPLACE FUNCTION pins_within_bounds(
  north_lat FLOAT,
  south_lat FLOAT,
  east_lng FLOAT,
  west_lng FLOAT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category pin_category,
  status pin_status,
  location GEOGRAPHY,
  address TEXT,
  images TEXT[],
  tags TEXT[],
  metadata JSONB,
  like_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  is_featured BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  group_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.status,
    p.location,
    p.address,
    p.images,
    p.tags,
    p.metadata,
    p.like_count,
    p.comment_count,
    p.view_count,
    p.is_featured,
    p.expires_at,
    p.created_by,
    p.group_id,
    p.created_at,
    p.updated_at
  FROM public.pins p
  WHERE ST_Within(
    p.location,
    ST_MakeEnvelope(west_lng, south_lat, east_lng, north_lat, 4326)
  )
  AND p.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Function to get distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 FLOAT,
  lng1 FLOAT,
  lat2 FLOAT,
  lng2 FLOAT
)
RETURNS FLOAT AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lng1, lat1), 4326),
    ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)
  ) / 1000; -- Return distance in kilometers
END;
$$ LANGUAGE plpgsql;

-- Function to get pins by category within radius
CREATE OR REPLACE FUNCTION pins_by_category_within_radius(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_km FLOAT,
  pin_category pin_category
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category pin_category,
  status pin_status,
  location GEOGRAPHY,
  address TEXT,
  images TEXT[],
  tags TEXT[],
  metadata JSONB,
  like_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  is_featured BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  group_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.status,
    p.location,
    p.address,
    p.images,
    p.tags,
    p.metadata,
    p.like_count,
    p.comment_count,
    p.view_count,
    p.is_featured,
    p.expires_at,
    p.created_by,
    p.group_id,
    p.created_at,
    p.updated_at,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
    ) / 1000 AS distance_km
  FROM public.pins p
  WHERE ST_DWithin(
    p.location,
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326),
    radius_km * 1000
  )
  AND p.status = 'active'
  AND p.category = pin_category
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending pins (high engagement) within radius
CREATE OR REPLACE FUNCTION trending_pins_within_radius(
  center_lat FLOAT,
  center_lng FLOAT,
  radius_km FLOAT,
  days_back INTEGER DEFAULT 7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  category pin_category,
  status pin_status,
  location GEOGRAPHY,
  address TEXT,
  images TEXT[],
  tags TEXT[],
  metadata JSONB,
  like_count INTEGER,
  comment_count INTEGER,
  view_count INTEGER,
  is_featured BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  group_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_km FLOAT,
  engagement_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.category,
    p.status,
    p.location,
    p.address,
    p.images,
    p.tags,
    p.metadata,
    p.like_count,
    p.comment_count,
    p.view_count,
    p.is_featured,
    p.expires_at,
    p.created_by,
    p.group_id,
    p.created_at,
    p.updated_at,
    ST_Distance(
      p.location,
      ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
    ) / 1000 AS distance_km,
    -- Calculate engagement score based on likes, comments, and views
    (p.like_count * 3 + p.comment_count * 5 + p.view_count * 0.1)::FLOAT AS engagement_score
  FROM public.pins p
  WHERE ST_DWithin(
    p.location,
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326),
    radius_km * 1000
  )
  AND p.status = 'active'
  AND p.created_at >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY engagement_score DESC, distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get pin density in an area (for heatmap)
CREATE OR REPLACE FUNCTION pin_density_grid(
  north_lat FLOAT,
  south_lat FLOAT,
  east_lng FLOAT,
  west_lng FLOAT,
  grid_size INTEGER DEFAULT 10
)
RETURNS TABLE (
  grid_x INTEGER,
  grid_y INTEGER,
  pin_count INTEGER,
  center_lat FLOAT,
  center_lng FLOAT
) AS $$
DECLARE
  lat_step FLOAT;
  lng_step FLOAT;
  x INTEGER;
  y INTEGER;
  cell_north FLOAT;
  cell_south FLOAT;
  cell_east FLOAT;
  cell_west FLOAT;
  cell_center_lat FLOAT;
  cell_center_lng FLOAT;
  cell_pin_count INTEGER;
BEGIN
  lat_step := (north_lat - south_lat) / grid_size;
  lng_step := (east_lng - west_lng) / grid_size;
  
  FOR x IN 0..grid_size-1 LOOP
    FOR y IN 0..grid_size-1 LOOP
      cell_west := west_lng + (x * lng_step);
      cell_east := west_lng + ((x + 1) * lng_step);
      cell_south := south_lat + (y * lat_step);
      cell_north := south_lat + ((y + 1) * lat_step);
      
      cell_center_lat := (cell_north + cell_south) / 2;
      cell_center_lng := (cell_east + cell_west) / 2;
      
      SELECT COUNT(*)::INTEGER INTO cell_pin_count
      FROM public.pins p
      WHERE ST_Within(
        p.location,
        ST_MakeEnvelope(cell_west, cell_south, cell_east, cell_north, 4326)
      )
      AND p.status = 'active';
      
      IF cell_pin_count > 0 THEN
        grid_x := x;
        grid_y := y;
        pin_count := cell_pin_count;
        center_lat := cell_center_lat;
        center_lng := cell_center_lng;
        RETURN NEXT;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate pin location (within allowed boundaries)
CREATE OR REPLACE FUNCTION is_location_valid(
  lat FLOAT,
  lng FLOAT
)
RETURNS BOOLEAN AS $$
DECLARE
  -- UK boundaries (example)
  uk_bounds GEOMETRY;
BEGIN
  -- Create a polygon for UK boundaries
  uk_bounds := ST_GeomFromText(
    'POLYGON((-8.2 49.8, 2.0 49.8, 2.0 60.9, -8.2 60.9, -8.2 49.8))',
    4326
  );
  
  RETURN ST_Within(
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    uk_bounds
  );
END;
$$ LANGUAGE plpgsql;

-- Create indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_pins_location_gist ON public.pins USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_pins_category_location ON public.pins USING GIST (location) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_pins_created_at_location ON public.pins (created_at, location) WHERE status = 'active';
