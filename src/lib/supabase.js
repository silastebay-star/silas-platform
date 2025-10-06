import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table schemas for TypeScript/validation
export const TABLES = {
  PINS: 'pins',
  FEEDBACK: 'feedback',
  COMMENTS: 'comments',
  USERS: 'users',
  ACTIVITIES: 'activities'
}

// Helper functions for common operations
export const supabaseHelpers = {
  // Pin operations
  async createPin(pinData) {
    const { data, error } = await supabase
      .from(TABLES.PINS)
      .insert([{
        name: pinData.name,
        description: pinData.description,
        layer: pinData.category,
        tags: pinData.tags,
        coordinates: [pinData.coords.lng, pinData.coords.lat],
        created_by: pinData.userId || 'anonymous',
        status: 'active'
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async getPins(layer = null) {
    let query = supabase
      .from(TABLES.PINS)
      .select(`
        *,
        feedback(count),
        comments(count),
        projects(progress)
      `)
      .eq('status', 'active')
    
    if (layer && layer !== 'All') {
      query = query.eq('layer', layer)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Feedback operations
  async addFeedback(pinId, type = 'like', userId = 'anonymous') {
    const { data, error } = await supabase
      .from(TABLES.FEEDBACK)
      .insert([{
        pin_id: pinId,
        type: type,
        user_id: userId
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async getFeedbackCount(pinId) {
    const { count, error } = await supabase
      .from(TABLES.FEEDBACK)
      .select('*', { count: 'exact' })
      .eq('pin_id', pinId)
    
    if (error) throw error
    return count
  },

  // Comment operations
  async addComment(pinId, text, userId = 'anonymous') {
    const { data, error } = await supabase
      .from(TABLES.COMMENTS)
      .insert([{
        pin_id: pinId,
        text: text,
        user_id: userId
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  async getComments(pinId) {
    const { data, error } = await supabase
      .from(TABLES.COMMENTS)
      .select('*')
      .eq('pin_id', pinId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Activity tracking
  async logActivity(type, data, userId = 'anonymous') {
    const { data: activity, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .insert([{
        type: type,
        data: data,
        user_id: userId
      }])
      .select()
    
    if (error) throw error
    return activity[0]
  },

  async getRecentActivities(limit = 10) {
    const { data, error } = await supabase
      .from(TABLES.ACTIVITIES)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  // Metrics and analytics
  async getLayerMetrics(layer = null) {
    try {
      // Get pins data
      let pinsQuery = supabase
        .from(TABLES.PINS)
        .select('*')
        .eq('status', 'active')

      if (layer && layer !== 'All') {
        pinsQuery = pinsQuery.eq('layer', layer)
      }

      const { data: pins, error: pinsError } = await pinsQuery
      if (pinsError) throw pinsError

      // Get feedback counts
      const { data: feedbackData, error: feedbackError } = await supabase
        .from(TABLES.FEEDBACK)
        .select('pin_id')

      if (feedbackError) console.warn('Feedback query error:', feedbackError)

      // Get comments counts
      const { data: commentsData, error: commentsError } = await supabase
        .from(TABLES.COMMENTS)
        .select('pin_id')

      if (commentsError) console.warn('Comments query error:', commentsError)

      // Process metrics
      const feedbackCounts = {}
      const commentsCounts = {}

      feedbackData?.forEach(f => {
        feedbackCounts[f.pin_id] = (feedbackCounts[f.pin_id] || 0) + 1
      })

      commentsData?.forEach(c => {
        commentsCounts[c.pin_id] = (commentsCounts[c.pin_id] || 0) + 1
      })

      const metrics = {
        totalPins: pins.length,
        totalFeedback: Object.values(feedbackCounts).reduce((sum, count) => sum + count, 0),
        totalComments: Object.values(commentsCounts).reduce((sum, count) => sum + count, 0),
        layerBreakdown: {},
        recentActivity: pins.filter(pin => {
          const created = new Date(pin.created_at);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return created > weekAgo;
        }).length
      };

      // Layer breakdown
      pins.forEach(pin => {
        if (!metrics.layerBreakdown[pin.layer]) {
          metrics.layerBreakdown[pin.layer] = {
            pins: 0,
            feedback: 0,
            comments: 0
          };
        }
        metrics.layerBreakdown[pin.layer].pins++;
        metrics.layerBreakdown[pin.layer].feedback += feedbackCounts[pin.id] || 0;
        metrics.layerBreakdown[pin.layer].comments += commentsCounts[pin.id] || 0;
      });

      return metrics;
    } catch (error) {
      console.error('Error in getLayerMetrics:', error)
      // Return safe fallback
      return {
        totalPins: 0,
        totalFeedback: 0,
        totalComments: 0,
        layerBreakdown: {},
        recentActivity: 0
      }
    }
  },

  async getCommunityVitality() {
    try {
      const [activities, pins] = await Promise.all([
        this.getRecentActivities(50),
        this.getPins()
      ]);

      const now = new Date();
      const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

      const dailyActivity = activities.filter(a => new Date(a.created_at) > dayAgo).length;
      const weeklyActivity = activities.filter(a => new Date(a.created_at) > weekAgo).length;

      // Simple engagement calculation based on pin count
      const engagementScore = pins.length * 2;

      return {
        dailyActivity,
        weeklyActivity,
        engagementScore,
        totalPins: pins.length,
        vitality: Math.min(100, Math.round((dailyActivity * 10 + weeklyActivity * 2 + engagementScore)))
      };
    } catch (error) {
      console.error('Error in getCommunityVitality:', error)
      // Return safe fallback
      return {
        dailyActivity: 0,
        weeklyActivity: 0,
        engagementScore: 0,
        totalPins: 0,
        vitality: 0
      }
    }
  }
}