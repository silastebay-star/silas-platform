-- Row Level Security Policies for SILAS Platform
-- Comprehensive security policies for all tables

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION is_moderator_or_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = user_id AND role IN ('moderator', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check group membership
CREATE OR REPLACE FUNCTION is_group_member(user_id UUID, group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE user_id = is_group_member.user_id AND group_id = is_group_member.group_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check group admin/moderator
CREATE OR REPLACE FUNCTION is_group_admin_or_moderator(user_id UUID, group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_memberships 
    WHERE user_id = is_group_admin_or_moderator.user_id 
    AND group_id = is_group_admin_or_moderator.group_id 
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view all active users" ON public.users
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups table policies
CREATE POLICY "Anyone can view public groups" ON public.groups
  FOR SELECT USING (is_public = true);

CREATE POLICY "Group members can view private groups" ON public.groups
  FOR SELECT USING (
    NOT is_public AND is_group_member(auth.uid(), id)
  );

CREATE POLICY "Authenticated users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Group admins can update groups" ON public.groups
  FOR UPDATE USING (
    is_group_admin_or_moderator(auth.uid(), id) OR is_admin(auth.uid())
  );

CREATE POLICY "Group admins can delete groups" ON public.groups
  FOR DELETE USING (
    is_group_admin_or_moderator(auth.uid(), id) OR is_admin(auth.uid())
  );

-- Group memberships policies
CREATE POLICY "Users can view group memberships" ON public.group_memberships
  FOR SELECT USING (
    -- Can see own memberships
    user_id = auth.uid() OR
    -- Can see memberships of public groups
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND is_public = true) OR
    -- Group members can see other memberships
    is_group_member(auth.uid(), group_id)
  );

CREATE POLICY "Users can join public groups" ON public.group_memberships
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND is_public = true)
  );

CREATE POLICY "Group admins can manage memberships" ON public.group_memberships
  FOR ALL USING (
    is_group_admin_or_moderator(auth.uid(), group_id) OR is_admin(auth.uid())
  );

CREATE POLICY "Users can leave groups" ON public.group_memberships
  FOR DELETE USING (user_id = auth.uid());

-- Pins table policies
CREATE POLICY "Anyone can view active pins" ON public.pins
  FOR SELECT USING (status = 'active');

CREATE POLICY "Moderators can view all pins" ON public.pins
  FOR SELECT USING (is_moderator_or_admin(auth.uid()));

CREATE POLICY "Authenticated users can create pins" ON public.pins
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    created_by = auth.uid() AND
    (group_id IS NULL OR is_group_member(auth.uid(), group_id))
  );

CREATE POLICY "Pin creators can update their pins" ON public.pins
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Group moderators can update group pins" ON public.pins
  FOR UPDATE USING (
    group_id IS NOT NULL AND 
    is_group_admin_or_moderator(auth.uid(), group_id)
  );

CREATE POLICY "Moderators can update any pin" ON public.pins
  FOR UPDATE USING (is_moderator_or_admin(auth.uid()));

CREATE POLICY "Pin creators can delete their pins" ON public.pins
  FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "Moderators can delete any pin" ON public.pins
  FOR DELETE USING (is_moderator_or_admin(auth.uid()));

-- Pin likes policies
CREATE POLICY "Anyone can view pin likes" ON public.pin_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like pins" ON public.pin_likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "Users can unlike their own likes" ON public.pin_likes
  FOR DELETE USING (user_id = auth.uid());

-- Pin comments policies
CREATE POLICY "Anyone can view comments on active pins" ON public.pin_comments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.pins WHERE id = pin_id AND status = 'active')
  );

CREATE POLICY "Authenticated users can comment" ON public.pin_comments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.pins WHERE id = pin_id AND status = 'active')
  );

CREATE POLICY "Comment authors can update their comments" ON public.pin_comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Comment authors can delete their comments" ON public.pin_comments
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Moderators can manage any comment" ON public.pin_comments
  FOR ALL USING (is_moderator_or_admin(auth.uid()));

-- Comment likes policies
CREATE POLICY "Anyone can view comment likes" ON public.comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like comments" ON public.comment_likes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

CREATE POLICY "Users can unlike their comment likes" ON public.comment_likes
  FOR DELETE USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- User follows policies
CREATE POLICY "Anyone can view follows" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "Users can follow others" ON public.user_follows
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND follower_id = auth.uid()
  );

CREATE POLICY "Users can unfollow" ON public.user_follows
  FOR DELETE USING (follower_id = auth.uid());

-- Pin reports policies
CREATE POLICY "Authenticated users can report pins" ON public.pin_reports
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND reported_by = auth.uid()
  );

CREATE POLICY "Moderators can view all reports" ON public.pin_reports
  FOR SELECT USING (is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can update reports" ON public.pin_reports
  FOR UPDATE USING (is_moderator_or_admin(auth.uid()));

-- Activities policies
CREATE POLICY "Users can view their own activities" ON public.activities
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view activities of people they follow" ON public.activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_follows 
      WHERE follower_id = auth.uid() AND following_id = user_id
    )
  );

CREATE POLICY "System can create activities" ON public.activities
  FOR INSERT WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to create activity entries
CREATE OR REPLACE FUNCTION create_activity(
  user_id UUID,
  activity_type TEXT,
  activity_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activities (user_id, type, data)
  VALUES (user_id, activity_type, activity_data)
  RETURNING id INTO activity_id;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type notification_type,
  title TEXT,
  message TEXT DEFAULT NULL,
  data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, title, message, data)
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
