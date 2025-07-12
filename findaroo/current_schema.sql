-- Current schema is already optimal for location functionality
-- The existing schema.sql includes:
-- 1. PostGIS extension for geographic data
-- 2. location GEOGRAPHY(Point, 4326) for precise coordinates
-- 3. location_name TEXT for human-readable addresses
-- 4. Proper RLS policies for security

-- Optional: Add spatial index for better performance on location queries
-- This can be added if needed for performance optimization:
-- CREATE INDEX IF NOT EXISTS items_location_idx ON items USING GIST (location);

-- Optional: Add function to calculate distance between points
-- This can be useful for "nearby items" functionality:
-- CREATE OR REPLACE FUNCTION calculate_distance(point1 geography, point2 geography)
-- RETURNS numeric AS $$
-- BEGIN
--   RETURN ST_Distance(point1, point2);
-- END;
-- $$ LANGUAGE plpgsql;