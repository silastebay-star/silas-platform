-- SILAS Platform Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Pins table (businesses, projects, events, groups)
CREATE TABLE IF NOT EXISTS public.pins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('business', 'project', 'event', 'group')),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  layer TEXT NOT NULL CHECK (layer IN ('Economy', 'Commerce', 'Faith', 'Works', 'Circle', 'Pulse', 'Mind')),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  stats JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;

-- Pins policies
CREATE POLICY "Pins are viewable by everyone" 
  ON public.pins FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create pins" 
  ON public.pins FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own pins" 
  ON public.pins FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own pins" 
  ON public.pins FOR DELETE 
  USING (auth.uid() = created_by);

-- Create index on location for spatial queries
CREATE INDEX IF NOT EXISTS pins_location_idx ON public.pins USING GIST(location);

-- Create index on layer for filtering
CREATE INDEX IF NOT EXISTS pins_layer_idx ON public.pins(layer);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS pins_type_idx ON public.pins(type);

-- Reactions table (support, join, endorse)
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('support', 'join', 'endorse')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pin_id, user_id, type)
);

-- Enable Row Level Security
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone" 
  ON public.reactions FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create reactions" 
  ON public.reactions FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" 
  ON public.reactions FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS reactions_pin_id_idx ON public.reactions(pin_id);
CREATE INDEX IF NOT EXISTS reactions_user_id_idx ON public.reactions(user_id);

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" 
  ON public.comments FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create comments" 
  ON public.comments FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update own comments" 
  ON public.comments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" 
  ON public.comments FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS comments_pin_id_idx ON public.comments(pin_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at DESC);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  layer TEXT NOT NULL CHECK (layer IN ('Economy', 'Commerce', 'Faith', 'Works', 'Circle', 'Pulse', 'Mind')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Events are viewable by everyone" 
  ON public.events FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can create events" 
  ON public.events FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own events" 
  ON public.events FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own events" 
  ON public.events FOR DELETE 
  USING (auth.uid() = created_by);

-- Create indexes
CREATE INDEX IF NOT EXISTS events_start_date_idx ON public.events(start_date);
CREATE INDEX IF NOT EXISTS events_layer_idx ON public.events(layer);
CREATE INDEX IF NOT EXISTS events_pin_id_idx ON public.events(pin_id);

-- Function to get this week's events
CREATE OR REPLACE FUNCTION get_this_week_events()
RETURNS TABLE (
  id UUID,
  title TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  layer TEXT,
  pin_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.title, e.start_date, e.layer, e.pin_id
  FROM public.events e
  WHERE e.start_date >= NOW()
    AND e.start_date < NOW() + INTERVAL '7 days'
  ORDER BY e.start_date ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pin with reaction counts
CREATE OR REPLACE FUNCTION get_pin_with_stats(pin_uuid UUID)
RETURNS TABLE (
  id UUID,
  type TEXT,
  name TEXT,
  description TEXT,
  layer TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  support_count BIGINT,
  join_count BIGINT,
  endorse_count BIGINT,
  comment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.type,
    p.name,
    p.description,
    p.layer,
    p.latitude,
    p.longitude,
    COUNT(DISTINCT CASE WHEN r.type = 'support' THEN r.id END) as support_count,
    COUNT(DISTINCT CASE WHEN r.type = 'join' THEN r.id END) as join_count,
    COUNT(DISTINCT CASE WHEN r.type = 'endorse' THEN r.id END) as endorse_count,
    COUNT(DISTINCT c.id) as comment_count
  FROM public.pins p
  LEFT JOIN public.reactions r ON p.id = r.pin_id
  LEFT JOIN public.comments c ON p.id = c.pin_id
  WHERE p.id = pin_uuid
  GROUP BY p.id, p.type, p.name, p.description, p.layer, p.latitude, p.longitude;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pins_updated_at BEFORE UPDATE ON public.pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
-- Note: This requires existing auth.users, so run after user signup

-- Sample events for this week
INSERT INTO public.events (title, description, start_date, layer) VALUES
  ('Community Garden Workday', 'Join us for planting and maintenance', NOW() + INTERVAL '2 hours', 'Works'),
  ('Town Hall Meeting', 'Monthly community governance meeting', NOW() + INTERVAL '2 days', 'Circle'),
  ('Farmers Market', 'Local produce and crafts', NOW() + INTERVAL '5 days', 'Commerce'),
  ('Sunday Service', 'Weekly worship service', NOW() + INTERVAL '6 days', 'Faith')
ON CONFLICT DO NOTHING;
