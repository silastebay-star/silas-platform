// SILAS Supabase Configuration
// Unified client setup for authentication, database, and real-time subscriptions

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'silas-platform@3.0.0'
    }
  }
})

// Database helper functions
export const db = {
  // Pins
  async getPins(filters = {}) {
    let query = supabase
      .from('pins')
      .select(`
        *,
        categories(name, slug, color, icon),
        projects(id, title, status, budget_total, budget_raised),
        pin_reactions(reaction_type, count(*)),
        pin_comments(count(*))
      `)
      .eq('status', 'active')

    if (filters.category) {
      query = query.eq('category_id', filters.category)
    }

    if (filters.bounds) {
      // PostGIS bounding box query
      const { north, south, east, west } = filters.bounds
      query = query.filter('geom', 'st_within', `POLYGON((${west} ${south}, ${east} ${south}, ${east} ${north}, ${west} ${north}, ${west} ${south}))`)
    }

    return query
  },

  async createPin(pinData) {
    return supabase
      .from('pins')
      .insert([pinData])
      .select()
  },

  async updatePin(id, updates) {
    return supabase
      .from('pins')
      .update(updates)
      .eq('id', id)
      .select()
  },

  // Categories
  async getCategories() {
    return supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
  },

  // Social interactions
  async addReaction(pinId, reactionType) {
    return supabase
      .from('pin_reactions')
      .upsert([{
        pin_id: pinId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        reaction_type: reactionType
      }])
  },

  async removeReaction(pinId, reactionType) {
    return supabase
      .from('pin_reactions')
      .delete()
      .eq('pin_id', pinId)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('reaction_type', reactionType)
  },

  async addComment(pinId, content, parentId = null) {
    return supabase
      .from('pin_comments')
      .insert([{
        pin_id: pinId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        content,
        parent_id: parentId
      }])
      .select(`
        *,
        user_profiles(display_name, avatar_url)
      `)
  },

  async getComments(pinId) {
    return supabase
      .from('pin_comments')
      .select(`
        *,
        user_profiles(display_name, avatar_url)
      `)
      .eq('pin_id', pinId)
      .order('created_at', { ascending: true })
  },

  // Projects
  async getProjects(filters = {}) {
    let query = supabase
      .from('projects')
      .select(`
        *,
        pins(name, geom, category_id),
        categories(name, color)
      `)

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.fundEligible) {
      query = query.eq('fund_eligible', true)
    }

    return query
  },

  // Fund system
  async getFundBalance() {
    const { data, error } = await supabase
      .from('fund_ledger')
      .select('amount, transaction_type')

    if (error) throw error

    return data.reduce((balance, transaction) => {
      return transaction.transaction_type === 'contribution' 
        ? balance + transaction.amount
        : balance - transaction.amount
    }, 0)
  },

  async getFundTransactions(limit = 50) {
    return supabase
      .from('fund_ledger')
      .select(`
        *,
        projects(title),
        user_profiles(display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
  },

  // Polls and voting
  async getActivePolls() {
    return supabase
      .from('polls')
      .select(`
        *,
        poll_options(id, option_text, vote_count),
        categories(name, color)
      `)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
  },

  async vote(pollId, optionId) {
    return supabase
      .from('poll_votes')
      .insert([{
        poll_id: pollId,
        option_id: optionId,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
  },

  // Events
  async getEvents(filters = {}) {
    let query = supabase
      .from('events')
      .select(`
        *,
        categories(name, color),
        pins(name, geom)
      `)
      .eq('is_public', true)

    if (filters.category) {
      query = query.eq('category_id', filters.category)
    }

    if (filters.upcoming) {
      query = query.gte('start_datetime', new Date().toISOString())
    }

    return query.order('start_datetime')
  },

  // AI Documents for RAG
  async searchDocuments(query, limit = 10) {
    return supabase
      .from('ai_documents')
      .select('*')
      .textSearch('content', query)
      .eq('is_public', true)
      .limit(limit)
  },

  async addDocument(title, content, sourceType, sourceId, categoryId = null) {
    return supabase
      .from('ai_documents')
      .insert([{
        title,
        content,
        source_type: sourceType,
        source_id: sourceId,
        category_id: categoryId
      }])
  }
}

// Real-time subscriptions
export const subscriptions = {
  // Subscribe to pin changes in a specific area
  subscribeToPins(bounds, callback) {
    return supabase
      .channel('pins-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pins' 
        }, 
        callback
      )
      .subscribe()
  },

  // Subscribe to comments on a specific pin
  subscribeToPinComments(pinId, callback) {
    return supabase
      .channel(`pin-comments-${pinId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pin_comments',
          filter: `pin_id=eq.${pinId}`
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to reactions on a specific pin
  subscribeToPinReactions(pinId, callback) {
    return supabase
      .channel(`pin-reactions-${pinId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pin_reactions',
          filter: `pin_id=eq.${pinId}`
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to fund transactions
  subscribeToFund(callback) {
    return supabase
      .channel('fund-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fund_ledger'
        },
        callback
      )
      .subscribe()
  }
}

// Authentication helpers
export const auth = {
  async signUp(email, password, metadata = {}) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
  },

  async signIn(email, password) {
    return supabase.auth.signInWithPassword({
      email,
      password
    })
  },

  async signOut() {
    return supabase.auth.signOut()
  },

  async getUser() {
    return supabase.auth.getUser()
  },

  async updateProfile(updates) {
    const user = await this.getUser()
    if (!user.data.user) throw new Error('No authenticated user')

    return supabase
      .from('user_profiles')
      .upsert([{
        id: user.data.user.id,
        ...updates
      }])
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export default supabase
