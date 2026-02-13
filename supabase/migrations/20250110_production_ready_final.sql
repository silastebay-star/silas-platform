-- Final Production-Ready Migration
-- Optimizations, indexes, and production configurations

BEGIN;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Core table indexes for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_location_gist ON public.pins USING GIST (location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_created_at_desc ON public.pins (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_category_status ON public.pins (category, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_created_by ON public.pins (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pins_updated_at ON public.pins (updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique ON public.users (email) WHERE email IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_unique ON public.users (username) WHERE username IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON public.users (created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_last_seen ON public.users (last_seen_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_status_created ON public.projects (status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_created_by ON public.projects (created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_category ON public.projects (category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_pin_id_created ON public.comments (pin_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_id ON public.comments (author_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_parent_id ON public.comments (parent_id) WHERE parent_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_pin_user ON public.votes (pin_id, user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_created ON public.votes (user_id, created_at DESC);

-- Activity and engagement indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_user_action ON public.activity_log (user_id, action, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_log_target ON public.activity_log (target_type, target_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type ON public.notifications (type);

-- Feed and social indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feed_items_author_created ON public.feed_items (author_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feed_items_type_created ON public.feed_items (type, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feed_items_pin_id ON public.feed_items (related_pin_id) WHERE related_pin_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_follower_following ON public.follows (follower_id, following_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_follows_following_created ON public.follows (following_id, created_at DESC);

-- Category-specific indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_green_initiatives_status_created ON public.green_initiatives (status, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_green_initiatives_location ON public.green_initiatives USING GIST (location) WHERE location IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_green_initiatives_category ON public.green_initiatives (category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_infrastructure_assets_type_status ON public.infrastructure_assets (type, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_infrastructure_assets_location ON public.infrastructure_assets USING GIST (location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_infrastructure_assets_priority ON public.infrastructure_assets (priority, next_maintenance);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_housing_market_area ON public.housing_market_data (area_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_housing_market_updated ON public.housing_market_data (last_updated DESC);

-- Census and analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_census_data_cache_bbox_level ON public.census_data_cache (bbox, level);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_census_data_cache_created ON public.census_data_cache (created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_environmental_metrics_category_updated ON public.environmental_metrics (category, last_updated DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_environmental_metrics_location ON public.environmental_metrics USING GIST (location) WHERE location IS NOT NULL;

-- ============================================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================================

-- User engagement analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.user_engagement_stats AS
SELECT 
  u.id as user_id,
  u.username,
  u.created_at as user_created_at,
  COUNT(DISTINCT p.id) as pins_created,
  COUNT(DISTINCT c.id) as comments_made,
  COUNT(DISTINCT v.id) as votes_cast,
  COUNT(DISTINCT pr.id) as projects_created,
  MAX(u.last_seen_at) as last_activity,
  EXTRACT(DAYS FROM NOW() - MAX(u.last_seen_at)) as days_since_last_activity
FROM public.users u
LEFT JOIN public.pins p ON u.id = p.created_by
LEFT JOIN public.comments c ON u.id = c.author_id
LEFT JOIN public.votes v ON u.id = v.user_id
LEFT JOIN public.projects pr ON u.id = pr.created_by
GROUP BY u.id, u.username, u.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_engagement_stats_user_id ON public.user_engagement_stats (user_id);

-- Community activity summary
CREATE MATERIALIZED VIEW IF NOT EXISTS public.community_activity_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as activity_date,
  'pin' as activity_type,
  COUNT(*) as activity_count
FROM public.pins
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)

UNION ALL

SELECT 
  DATE_TRUNC('day', created_at) as activity_date,
  'comment' as activity_type,
  COUNT(*) as activity_count
FROM public.comments
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)

UNION ALL

SELECT 
  DATE_TRUNC('day', created_at) as activity_date,
  'vote' as activity_type,
  COUNT(*) as activity_count
FROM public.votes
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)

ORDER BY activity_date DESC;

CREATE INDEX IF NOT EXISTS idx_community_activity_date_type ON public.community_activity_summary (activity_date, activity_type);

-- Pin popularity ranking
CREATE MATERIALIZED VIEW IF NOT EXISTS public.pin_popularity_ranking AS
SELECT 
  p.id,
  p.title,
  p.category,
  p.created_at,
  p.created_by,
  COUNT(DISTINCT v.id) as vote_count,
  COUNT(DISTINCT c.id) as comment_count,
  COUNT(DISTINCT v.id) * 2 + COUNT(DISTINCT c.id) as popularity_score,
  RANK() OVER (ORDER BY COUNT(DISTINCT v.id) * 2 + COUNT(DISTINCT c.id) DESC) as popularity_rank
FROM public.pins p
LEFT JOIN public.votes v ON p.id = v.pin_id
LEFT JOIN public.comments c ON p.id = c.pin_id
WHERE p.status = 'active'
GROUP BY p.id, p.title, p.category, p.created_at, p.created_by;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pin_popularity_ranking_id ON public.pin_popularity_ranking (id);
CREATE INDEX IF NOT EXISTS idx_pin_popularity_ranking_score ON public.pin_popularity_ranking (popularity_score DESC);

-- ============================================================================
-- FUNCTIONS FOR ANALYTICS AND PERFORMANCE
-- ============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_analytics_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.user_engagement_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.community_activity_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.pin_popularity_ranking;
END;
$$;

-- Function to get user activity summary
CREATE OR REPLACE FUNCTION public.get_user_activity_summary(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'pins_created', COUNT(DISTINCT p.id),
    'comments_made', COUNT(DISTINCT c.id),
    'votes_cast', COUNT(DISTINCT v.id),
    'projects_created', COUNT(DISTINCT pr.id),
    'followers', COUNT(DISTINCT f1.follower_id),
    'following', COUNT(DISTINCT f2.following_id)
  )
  INTO result
  FROM public.users u
  LEFT JOIN public.pins p ON u.id = p.created_by
  LEFT JOIN public.comments c ON u.id = c.author_id
  LEFT JOIN public.votes v ON u.id = v.user_id
  LEFT JOIN public.projects pr ON u.id = pr.created_by
  LEFT JOIN public.follows f1 ON u.id = f1.following_id
  LEFT JOIN public.follows f2 ON u.id = f2.follower_id
  WHERE u.id = user_uuid;
  
  RETURN result;
END;
$$;

-- Function to get trending pins
CREATE OR REPLACE FUNCTION public.get_trending_pins(days_back integer DEFAULT 7, limit_count integer DEFAULT 10)
RETURNS TABLE (
  pin_id uuid,
  title text,
  category text,
  vote_count bigint,
  comment_count bigint,
  trend_score numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.category,
    COUNT(DISTINCT v.id) as vote_count,
    COUNT(DISTINCT c.id) as comment_count,
    (COUNT(DISTINCT v.id) * 2.0 + COUNT(DISTINCT c.id) * 1.5) / 
    EXTRACT(DAYS FROM NOW() - p.created_at + INTERVAL '1 day') as trend_score
  FROM public.pins p
  LEFT JOIN public.votes v ON p.id = v.pin_id AND v.created_at >= NOW() - INTERVAL '1 day' * days_back
  LEFT JOIN public.comments c ON p.id = c.pin_id AND c.created_at >= NOW() - INTERVAL '1 day' * days_back
  WHERE p.status = 'active' 
    AND p.created_at >= NOW() - INTERVAL '1 day' * days_back
  GROUP BY p.id, p.title, p.category, p.created_at
  ORDER BY trend_score DESC
  LIMIT limit_count;
END;
$$;

-- ============================================================================
-- AUTOMATED MAINTENANCE TASKS
-- ============================================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up old activity logs (keep 6 months)
  DELETE FROM public.activity_log 
  WHERE created_at < NOW() - INTERVAL '6 months';
  
  -- Clean up old notifications (keep 3 months)
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '3 months' AND read = true;
  
  -- Clean up old cache entries
  DELETE FROM public.census_data_cache 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  DELETE FROM public.environmental_data_cache 
  WHERE created_at < NOW() - INTERVAL '1 day';
  
  -- Update user last_seen for active users
  UPDATE public.users 
  SET last_seen_at = NOW() 
  WHERE id IN (
    SELECT DISTINCT user_id 
    FROM public.activity_log 
    WHERE created_at >= NOW() - INTERVAL '1 day'
  );
END;
$$;

-- ============================================================================
-- TRIGGERS FOR REAL-TIME UPDATES
-- ============================================================================

-- Function to update pin vote counts
CREATE OR REPLACE FUNCTION public.update_pin_vote_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pins 
    SET vote_count = vote_count + 1,
        updated_at = NOW()
    WHERE id = NEW.pin_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pins 
    SET vote_count = GREATEST(vote_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.pin_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_pin_vote_count ON public.votes;
CREATE TRIGGER trigger_update_pin_vote_count
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pin_vote_count();

-- Function to update pin comment counts
CREATE OR REPLACE FUNCTION public.update_pin_comment_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.pins 
    SET comment_count = comment_count + 1,
        updated_at = NOW()
    WHERE id = NEW.pin_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.pins 
    SET comment_count = GREATEST(comment_count - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.pin_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_pin_comment_count ON public.comments;
CREATE TRIGGER trigger_update_pin_comment_count
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pin_comment_count();

-- ============================================================================
-- PRODUCTION CONFIGURATION
-- ============================================================================

-- Set up automated statistics collection
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET track_functions = 'all';

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';

-- Set up automated vacuum and analyze
ALTER SYSTEM SET autovacuum = on;
ALTER SYSTEM SET autovacuum_max_workers = 3;
ALTER SYSTEM SET autovacuum_naptime = '1min';

-- Configure logging for production
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- ============================================================================
-- FINAL GRANTS AND PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.refresh_analytics_views() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activity_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trending_pins(integer, integer) TO authenticated;

-- Grant select permissions on materialized views
GRANT SELECT ON public.user_engagement_stats TO authenticated;
GRANT SELECT ON public.community_activity_summary TO authenticated;
GRANT SELECT ON public.pin_popularity_ranking TO authenticated;

-- Create scheduled job to refresh analytics (if pg_cron is available)
-- SELECT cron.schedule('refresh-analytics', '0 */6 * * *', 'SELECT public.refresh_analytics_views();');
-- SELECT cron.schedule('cleanup-old-data', '0 2 * * 0', 'SELECT public.cleanup_old_data();');

COMMIT;
