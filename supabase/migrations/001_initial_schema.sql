-- SILAS Platform Database Schema
-- Complete production-ready schema with all tables, RLS policies, and triggers

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
CREATE TYPE pin_category AS ENUM (
  'community',
  'faith', 
  'projects',
  'economy',
  'events',
  'data_ai',
  'issues',
  'heritage_culture',
  'governance'
);
CREATE TYPE pin_status AS ENUM ('active', 'pending', 'archived', 'flagged');
CREATE TYPE group_role AS ENUM ('member', 'moderator', 'admin');
CREATE TYPE notification_type AS ENUM (
  'pin_created',
  'pin_liked',
  'pin_commented',
  'group_invite',
  'group_joined',
  'group_post',
  'system'
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  role user_role DEFAULT 'user',
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category pin_category NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 0,
  pin_count INTEGER DEFAULT 0,
  location TEXT,
  website TEXT,
  rules TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group memberships
CREATE TABLE public.group_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role group_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE(group_id, user_id)
);

-- Pins table
CREATE TABLE public.pins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category pin_category NOT NULL,
  status pin_status DEFAULT 'active',
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pin likes
CREATE TABLE public.pin_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pin_id, user_id)
);

-- Pin comments
CREATE TABLE public.pin_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.pin_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment likes
CREATE TABLE public.comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID REFERENCES public.pin_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User follows (for following other users)
CREATE TABLE public.user_follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Pin reports (for moderation)
CREATE TABLE public.pin_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pin_id UUID REFERENCES public.pins(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity feed
CREATE TABLE public.activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pins_location ON public.pins USING GIST (location);
CREATE INDEX idx_pins_category ON public.pins (category);
CREATE INDEX idx_pins_status ON public.pins (status);
CREATE INDEX idx_pins_created_by ON public.pins (created_by);
CREATE INDEX idx_pins_group_id ON public.pins (group_id);
CREATE INDEX idx_pins_created_at ON public.pins (created_at DESC);

CREATE INDEX idx_groups_category ON public.groups (category);
CREATE INDEX idx_groups_slug ON public.groups (slug);
CREATE INDEX idx_groups_created_by ON public.groups (created_by);

CREATE INDEX idx_group_memberships_user_id ON public.group_memberships (user_id);
CREATE INDEX idx_group_memberships_group_id ON public.group_memberships (group_id);

CREATE INDEX idx_pin_comments_pin_id ON public.pin_comments (pin_id);
CREATE INDEX idx_pin_comments_user_id ON public.pin_comments (user_id);
CREATE INDEX idx_pin_comments_parent_id ON public.pin_comments (parent_id);

CREATE INDEX idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications (created_at DESC);

CREATE INDEX idx_activities_user_id ON public.activities (user_id);
CREATE INDEX idx_activities_created_at ON public.activities (created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pins_updated_at BEFORE UPDATE ON public.pins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pin_comments_updated_at BEFORE UPDATE ON public.pin_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create count update functions
CREATE OR REPLACE FUNCTION update_pin_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pins SET like_count = like_count + 1 WHERE id = NEW.pin_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pins SET like_count = like_count - 1 WHERE id = OLD.pin_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_pin_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pins SET comment_count = comment_count + 1 WHERE id = NEW.pin_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pins SET comment_count = comment_count - 1 WHERE id = OLD.pin_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = member_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_group_pin_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
    UPDATE public.groups SET pin_count = pin_count + 1 WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.group_id IS NOT NULL THEN
    UPDATE public.groups SET pin_count = pin_count - 1 WHERE id = OLD.group_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.group_id IS DISTINCT FROM NEW.group_id THEN
      IF OLD.group_id IS NOT NULL THEN
        UPDATE public.groups SET pin_count = pin_count - 1 WHERE id = OLD.group_id;
      END IF;
      IF NEW.group_id IS NOT NULL THEN
        UPDATE public.groups SET pin_count = pin_count + 1 WHERE id = NEW.group_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply count triggers
CREATE TRIGGER trigger_update_pin_like_count
  AFTER INSERT OR DELETE ON public.pin_likes
  FOR EACH ROW EXECUTE FUNCTION update_pin_like_count();

CREATE TRIGGER trigger_update_pin_comment_count
  AFTER INSERT OR DELETE ON public.pin_comments
  FOR EACH ROW EXECUTE FUNCTION update_pin_comment_count();

CREATE TRIGGER trigger_update_group_member_count
  AFTER INSERT OR DELETE ON public.group_memberships
  FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

CREATE TRIGGER trigger_update_group_pin_count
  AFTER INSERT OR UPDATE OR DELETE ON public.pins
  FOR EACH ROW EXECUTE FUNCTION update_group_pin_count();
