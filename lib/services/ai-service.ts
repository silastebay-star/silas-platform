/**
 * AI Service
 * Handles AI-powered features including RAG, summarization, and civic insights
 */

import { createSupabaseClient, withSupabaseErrorHandling } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

export type DocumentSourceType = 'pin' | 'post' | 'project' | 'event' | 'manual' | 'census'
export type AccessLevel = 'public' | 'members' | 'admin'

export interface AIDocument {
  id: string
  title: string
  content: string
  content_type: string
  source_type: DocumentSourceType
  source_id?: string
  embedding?: number[]
  category_id?: string
  tags: string[]
  is_public: boolean
  access_level: AccessLevel
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateDocumentData {
  title: string
  content: string
  content_type?: string
  source_type: DocumentSourceType
  source_id?: string
  category_id?: string
  tags?: string[]
  is_public?: boolean
  access_level?: AccessLevel
  metadata?: Record<string, any>
}

export interface SearchQuery {
  query: string
  category_id?: string
  source_type?: DocumentSourceType
  limit?: number
  similarity_threshold?: number
}

export interface AIInsight {
  type: 'summary' | 'trend' | 'recommendation' | 'alert'
  title: string
  content: string
  confidence: number
  category?: string
  metadata: Record<string, any>
  created_at: string
}

export interface CommunityAnalytics {
  engagement_trends: {
    period: string
    pins_created: number
    comments_posted: number
    votes_cast: number
    fund_contributions: number
  }[]
  category_activity: {
    category: string
    activity_score: number
    growth_rate: number
  }[]
  top_contributors: {
    user_id: string
    display_name?: string
    contribution_score: number
  }[]
  community_health_score: number
  insights: AIInsight[]
}

class AIService {
  private supabase = createSupabaseClient()

  // =============================================
  // DOCUMENT MANAGEMENT FOR RAG
  // =============================================

  async createDocument(data: CreateDocumentData): Promise<{
    document: AIDocument;
    error?: string
  }> {
    try {
      // Generate embedding for the content
      const embedding = await this.generateEmbedding(data.content)

      const { data: document, error } = await (this.supabase
        .from('ai_documents') as any)
        .insert({
          title: data.title,
          content: data.content,
          content_type: data.content_type || 'text',
          source_type: data.source_type,
          source_id: data.source_id,
          embedding,
          category_id: data.category_id,
          tags: data.tags || [],
          is_public: data.is_public !== false,
          access_level: data.access_level || 'public',
          metadata: data.metadata || {}
        })
        .select()
        .single()

      if (error) {
        return { document: null as any, error: error.message }
      }

      return { document: document as AIDocument, error: undefined }
    } catch (error) {
      return { document: null as any, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async searchDocuments(query: SearchQuery): Promise<{
    documents: AIDocument[];
    error?: string
  }> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query.query)

      let rpcQuery = (this.supabase as any)
        .rpc('search_documents', {
          query_embedding: queryEmbedding,
          similarity_threshold: query.similarity_threshold || 0.7,
          match_count: query.limit || 10
        })

      // Apply additional filters
      if (query.category_id) {
        rpcQuery = rpcQuery.eq('category_id', query.category_id)
      }
      if (query.source_type) {
        rpcQuery = rpcQuery.eq('source_type', query.source_type)
      }

      const { data: documents, error } = await rpcQuery

      if (error) {
        return { documents: [], error: error.message }
      }

      return { documents: documents || [], error: undefined }
    } catch (error) {
      return { documents: [], error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // This would integrate with your chosen embedding model
    // For now, return a placeholder embedding
    // In production, you'd call OpenAI, Cohere, or local embedding model
    
    try {
      const response = await fetch('/api/ai/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate embedding')
      }

      const { embedding } = await response.json()
      return embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      // Return a zero vector as fallback
      return new Array(384).fill(0)
    }
  }

  // =============================================
  // AI-POWERED INSIGHTS
  // =============================================

  async generatePinSummary(pinId: string): Promise<{
    summary: string;
    key_points: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    error?: string
  }> {
    try {
      // Get pin and its posts
      const { data: pin, error } = await this.supabase
        .from('pins')
        .select(`
          *,
          posts:pin_posts(content, created_at)
        `)
        .eq('id', pinId)
        .single()

      if (error || !pin) {
        return {
          summary: '',
          key_points: [],
          sentiment: 'neutral' as const,
          error: error?.message || 'Pin not found'
        }
      }

      // Combine pin content and posts for summarization
      const fullContent = [
        (pin as any).title,
        (pin as any).description,
        ...(pin as any).posts.map((p: any) => p.content)
      ].join('\n\n')

      // Generate summary using AI
      const summary = await this.generateSummary(fullContent)
      const keyPoints = await this.extractKeyPoints(fullContent)
      const sentiment = await this.analyzeSentiment(fullContent)

      return {
        summary,
        key_points: keyPoints,
        sentiment,
        error: undefined
      }
    } catch (error) {
      return {
        summary: '',
        key_points: [],
        sentiment: 'neutral' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async generateCommunityInsights(): Promise<{
    analytics: CommunityAnalytics;
    error?: string
  }> {
    try {
      // Get engagement trends (last 12 weeks)
      const { data: engagementData } = await (this.supabase as any)
        .rpc('get_engagement_trends', { weeks: 12 })

      // Get category activity
      const { data: categoryData } = await (this.supabase as any)
        .rpc('get_category_activity')

      // Get top contributors
      const { data: contributorData } = await (this.supabase as any)
        .rpc('get_top_contributors', { limit: 10 })

      // Calculate community health score
      const healthScore = await this.calculateCommunityHealthScore()

      // Generate AI insights
      const insights = await this.generateAIInsights({
        engagement: engagementData,
        categories: categoryData,
        contributors: contributorData,
        health_score: healthScore
      })

      return {
        analytics: {
          engagement_trends: engagementData || [],
          category_activity: categoryData || [],
          top_contributors: contributorData || [],
          community_health_score: healthScore,
          insights
        },
        error: undefined
      }
    } catch (error) {
      return {
        analytics: {
          engagement_trends: [],
          category_activity: [],
          top_contributors: [],
          community_health_score: 0,
          insights: []
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const { summary } = await response.json()
      return summary
    } catch (error) {
      console.error('Error generating summary:', error)
      return 'Summary generation temporarily unavailable.'
    }
  }

  private async extractKeyPoints(content: string): Promise<string[]> {
    try {
      const response = await fetch('/api/ai/key-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to extract key points')
      }

      const { key_points } = await response.json()
      return key_points
    } catch (error) {
      console.error('Error extracting key points:', error)
      return []
    }
  }

  private async analyzeSentiment(content: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze sentiment')
      }

      const { sentiment } = await response.json()
      return sentiment
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
      return 'neutral'
    }
  }

  private async calculateCommunityHealthScore(): Promise<number> {
    // Calculate a health score based on various metrics
    const { data: metrics } = await this.supabase
      .rpc('get_community_health_metrics')

    if (!metrics) return 50 // Default neutral score

    // Weighted scoring algorithm
    const weights = {
      active_users: 0.3,
      engagement_rate: 0.25,
      content_quality: 0.2,
      response_time: 0.15,
      fund_participation: 0.1
    }

    let score = 0
    Object.entries(weights).forEach(([metric, weight]) => {
      score += (metrics[metric] || 0) * weight
    })

    return Math.min(100, Math.max(0, score))
  }

  private async generateAIInsights(data: any): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Trend analysis
    if (data.engagement?.length > 0) {
      const recent = data.engagement.slice(-4)
      const older = data.engagement.slice(-8, -4)
      
      const recentAvg = recent.reduce((sum: number, week: any) => 
        sum + week.pins_created + week.comments_posted, 0) / recent.length
      const olderAvg = older.reduce((sum: number, week: any) => 
        sum + week.pins_created + week.comments_posted, 0) / older.length

      if (recentAvg > olderAvg * 1.2) {
        insights.push({
          type: 'trend',
          title: 'Community Engagement Increasing',
          content: `Community activity has increased by ${Math.round((recentAvg / olderAvg - 1) * 100)}% over the past month.`,
          confidence: 0.8,
          category: 'engagement',
          metadata: { trend: 'positive', change: recentAvg / olderAvg },
          created_at: new Date().toISOString()
        })
      }
    }

    // Category recommendations
    if (data.categories?.length > 0) {
      const leastActive = data.categories
        .sort((a: any, b: any) => a.activity_score - b.activity_score)[0]

      if (leastActive.activity_score < 20) {
        insights.push({
          type: 'recommendation',
          title: `Boost ${leastActive.category} Category`,
          content: `The ${leastActive.category} category has low activity. Consider organizing events or initiatives to increase engagement.`,
          confidence: 0.7,
          category: leastActive.category,
          metadata: { activity_score: leastActive.activity_score },
          created_at: new Date().toISOString()
        })
      }
    }

    return insights
  }

  // =============================================
  // MODERATION ASSISTANCE
  // =============================================

  async moderateContent(content: string): Promise<{
    is_appropriate: boolean
    confidence: number
    issues: string[]
    suggested_action: 'approve' | 'review' | 'reject'
    error?: string
  }> {
    try {
      const response = await fetch('/api/ai/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        return {
          is_appropriate: false,
          confidence: 0,
          issues: ['Failed to moderate content'],
          suggested_action: 'review' as const,
          error: 'Failed to moderate content'
        }
      }

      const result = await response.json()
      return { ...result, error: undefined }
    } catch (error) {
      return {
        is_appropriate: false,
        confidence: 0,
        issues: ['Moderation service error'],
        suggested_action: 'review' as const,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export default new AIService()
