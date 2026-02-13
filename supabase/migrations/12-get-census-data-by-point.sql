
-- Create a PostGIS function to get census data by point
CREATE OR REPLACE FUNCTION get_census_data_by_point(point_lat float, point_lng float)
RETURNS SETOF census_data
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM census_data
  WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(point_lng, point_lat), 4326));
END;
$$;
