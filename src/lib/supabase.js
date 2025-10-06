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
  ACTIVITIES: 'activities',
  PIN_PROPOSALS: 'pin_proposals',
  PIN_BLOCK_CELLS: 'pin_block_cells',
  PROJECT_PINS: 'project_pins',
  PIN_PHOTOS: 'pin_photos',
  ISSUE_FLAGS: 'issue_flags'
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
        status: pinData.metadata?.isIssue ? 'pending' : 'active', // Issues need approval
        metadata: pinData.metadata || {}
      }])
      .select()

    if (error) throw error

    // If it's an issue pin, create an issue flag
    if (pinData.metadata?.isIssue && data[0]) {
      await this.createIssueFlag(data[0].id, pinData.metadata.priority, pinData.userId);
    }

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
  },

  // Enhanced pin system functions
  async createBulkPins(pinsArray) {
    const insertData = pinsArray.map(pinData => ({
      name: pinData.title || pinData.name,
      description: pinData.description,
      layer: pinData.category,
      coordinates: [pinData.lng, pinData.lat],
      created_by: 'anonymous',
      status: 'active',
      metadata: {
        bulkCreated: true,
        priority: pinData.priority || 'normal',
        createdAt: new Date().toISOString()
      }
    }));

    const { data, error } = await supabase
      .from(TABLES.PINS)
      .insert(insertData)
      .select();

    if (error) throw error;
    return data;
  },

  async createIssueFlag(pinId, priority = 'normal', userId = 'anonymous') {
    const severityMap = { urgent: 1, high: 2, normal: 3 };

    const { data, error } = await supabase
      .from(TABLES.ISSUE_FLAGS)
      .insert([{
        pin_id: pinId,
        severity: severityMap[priority] || 3,
        reported_by: userId,
        status: 'open'
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getIssueFlags(status = null) {
    let query = supabase
      .from(TABLES.ISSUE_FLAGS)
      .select(`
        *,
        pins(name, description, layer)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateIssueStatus(issueId, status, assignedTo = null) {
    const updateData = { status };
    if (assignedTo) updateData.assigned_to = assignedTo;
    if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from(TABLES.ISSUE_FLAGS)
      .update(updateData)
      .eq('id', issueId)
      .select();

    if (error) throw error;
    return data[0];
  },

  async createPinProposal(proposalData) {
    const { data, error } = await supabase
      .from(TABLES.PIN_PROPOSALS)
      .insert([{
        pin_id: proposalData.pinId || null,
        proposer_id: proposalData.proposerId || 'anonymous',
        action: proposalData.action,
        payload: proposalData.payload,
        status: 'pending'
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getPinProposals(status = 'pending') {
    const { data, error } = await supabase
      .from(TABLES.PIN_PROPOSALS)
      .select(`
        *,
        pins(name, description, layer)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async approvePinProposal(proposalId, reviewerId = 'admin') {
    const { data, error } = await supabase
      .from(TABLES.PIN_PROPOSALS)
      .update({
        status: 'approved',
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select();

    if (error) throw error;
    return data[0];
  },

  async rejectPinProposal(proposalId, reviewerId = 'admin') {
    const { data, error } = await supabase
      .from(TABLES.PIN_PROPOSALS)
      .update({
        status: 'rejected',
        reviewer_id: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select();

    if (error) throw error;
    return data[0];
  },

  async checkCellBlocked(communityId, cellX, cellY) {
    const { data, error } = await supabase
      .from(TABLES.PIN_BLOCK_CELLS)
      .select('*')
      .eq('community_id', communityId)
      .eq('cell_x', cellX)
      .eq('cell_y', cellY)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return !!data;
  },

  async blockCell(communityId, cellX, cellY, reason = 'blocked') {
    const { data, error } = await supabase
      .from(TABLES.PIN_BLOCK_CELLS)
      .insert([{
        community_id: communityId,
        cell_x: cellX,
        cell_y: cellY,
        bucket: { reason, blocked_at: new Date().toISOString() }
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async addPinPhoto(pinId, photoData, uploadedBy = 'anonymous') {
    const { data, error } = await supabase
      .from(TABLES.PIN_PHOTOS)
      .insert([{
        pin_id: pinId,
        uploaded_by: uploadedBy,
        storage_path: photoData.path,
        caption: photoData.caption,
        approved: false // Photos need approval
      }])
      .select();

    if (error) throw error;
    return data[0];
  },

  async getPinPhotos(pinId, approvedOnly = true) {
    let query = supabase
      .from(TABLES.PIN_PHOTOS)
      .select('*')
      .eq('pin_id', pinId)
      .order('created_at', { ascending: false });

    if (approvedOnly) {
      query = query.eq('approved', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async approvePhoto(photoId) {
    const { data, error } = await supabase
      .from(TABLES.PIN_PHOTOS)
      .update({ approved: true })
      .eq('id', photoId)
      .select();

    if (error) throw error;
    return data[0];
  },

  // Enhanced admin functions
  async getAdminStats() {
    try {
      const [pins, proposals, issues, activities] = await Promise.all([
        this.getPins(),
        this.getPinProposals('pending'),
        this.getIssueFlags('open'),
        this.getRecentActivities(100)
      ]);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const resolvedToday = await supabase
        .from(TABLES.ISSUE_FLAGS)
        .select('*')
        .eq('status', 'resolved')
        .gte('resolved_at', todayStart.toISOString());

      return {
        totalPins: pins.length,
        pendingApproval: proposals.length,
        activeIssues: issues.length,
        resolvedToday: resolvedToday.data?.length || 0,
        recentActivity: activities.filter(a =>
          new Date(a.created_at) > new Date(now - 24 * 60 * 60 * 1000)
        ).length
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      return {
        totalPins: 0,
        pendingApproval: 0,
        activeIssues: 0,
        resolvedToday: 0,
        recentActivity: 0
      };
    }
  }
}