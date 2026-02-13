-- Authentication and user profiles setup for SILAS
-- This migration sets up user profiles and authentication-related tables

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  preferences JSONB DEFAULT '{}',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'friends', 'private')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Create user sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_activity
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Create indexes for user_activity
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activity (user_id, action, resource_type, resource_id, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for user_profiles
-- Users can view public profiles and their own profile
CREATE POLICY "Users can view public profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  privacy_level = 'public' OR 
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.role IN ('moderator', 'admin')
  )
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.role = 'admin'
  )
);

-- RLS Policies for user_sessions
-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
ON user_sessions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own sessions
CREATE POLICY "Users can create own sessions"
ON user_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
ON user_sessions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON user_sessions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for user_activity
-- Users can view their own activity
CREATE POLICY "Users can view own activity"
ON user_activity
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert activity logs
CREATE POLICY "System can log activity"
ON user_activity
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Moderators and admins can view all activity
CREATE POLICY "Moderators can view all activity"
ON user_activity
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.role IN ('moderator', 'admin')
  )
);

-- Update existing tables to reference user profiles
-- Add created_by to pins table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pins' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE pins ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add created_by to comments table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'comments' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE comments ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Add created_by to likes table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'likes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE likes ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update RLS policies for pins to include user ownership
DROP POLICY IF EXISTS "Pins are viewable by everyone" ON pins;
CREATE POLICY "Pins are viewable by everyone"
ON pins
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can insert pins" ON pins;
CREATE POLICY "Users can insert pins"
ON pins
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own pins" ON pins;
CREATE POLICY "Users can update own pins"
ON pins
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own pins" ON pins;
CREATE POLICY "Users can delete own pins"
ON pins
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles up 
    WHERE up.id = auth.uid() AND up.role IN ('moderator', 'admin')
  )
);

-- Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated, anon;
GRANT INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON user_sessions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_sessions TO authenticated;
GRANT SELECT ON user_activity TO authenticated;
GRANT INSERT ON user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;

-- Create view for public user profiles
CREATE OR REPLACE VIEW public_user_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  bio,
  location,
  website,
  created_at
FROM user_profiles
WHERE privacy_level = 'public' AND status = 'active';

GRANT SELECT ON public_user_profiles TO authenticated, anon;
