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
    let query = supabase
      .from(TABLES.PINS)
      .select(`
        layer,
        feedback(count),
        comments(count),
        created_at
      `)
      .eq('status', 'active')

    if (layer && layer !== 'All') {
      query = query.eq('layer', layer)
    }

    const { data, error } = await query
    if (error) throw error

    // Process metrics
    const metrics = {
      totalPins: data.length,
      totalFeedback: data.reduce((sum, pin) => sum + (pin.feedback[0]?.count || 0), 0),
      totalComments: data.reduce((sum, pin) => sum + (pin.comments[0]?.count || 0), 0),
      layerBreakdown: {},
      recentActivity: data.filter(pin => {
        const created = new Date(pin.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return created > weekAgo;
      }).length
    };

    // Layer breakdown
    data.forEach(pin => {
      if (!metrics.layerBreakdown[pin.layer]) {
        metrics.layerBreakdown[pin.layer] = {
          pins: 0,
          feedback: 0,
          comments: 0
        };
      }
      metrics.layerBreakdown[pin.layer].pins++;
      metrics.layerBreakdown[pin.layer].feedback += pin.feedback[0]?.count || 0;
      metrics.layerBreakdown[pin.layer].comments += pin.comments[0]?.count || 0;
    });

    return metrics;
  },

  async getCommunityVitality() {
    const [activities, pins] = await Promise.all([
      this.getRecentActivities(50),
      this.getPins()
    ]);

    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const dailyActivity = activities.filter(a => new Date(a.created_at) > dayAgo).length;
    const weeklyActivity = activities.filter(a => new Date(a.created_at) > weekAgo).length;

    const engagementScore = pins.reduce((score, pin) => {
      const feedback = pin.feedback[0]?.count || 0;
      const comments = pin.comments[0]?.count || 0;
      return score + feedback + (comments * 2); // Comments weighted higher
    }, 0);

    return {
      dailyActivity,
      weeklyActivity,
      engagementScore,
      totalPins: pins.length,
      vitality: Math.min(100, Math.round((dailyActivity * 10 + weeklyActivity * 2 + engagementScore / 10)))
    };
  }
}