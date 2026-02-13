/**
 * AI Copilot Module Types
 */

export interface AIConversation {
  id: string
  user_id: string
  title?: string
  context_type?: 'general' | 'fund' | 'events' | 'economy' | 'environment'
  context_id?: string
  status: 'active' | 'archived' | 'deleted'
  message_count: number
  last_message_at: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
  // Related data
  messages?: AIMessage[]
  user_profile?: UserProfile
  context_entity?: any // The related entity (proposal, event, etc.)
}

export interface CreateAIConversationData {
  title?: string
  context_type?: AIConversation['context_type']
  context_id?: string
  metadata?: Record<string, any>
}

export interface UpdateAIConversationData {
  title?: string
  status?: AIConversation['status']
  metadata?: Record<string, any>
}

export interface AIMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used: number
  model_used?: string
  response_time_ms?: number
  created_at: string
  metadata?: Record<string, any>
  // Computed fields
  is_recent?: boolean
  formatted_time?: string
  // Related data
  conversation?: AIConversation
}

export interface CreateAIMessageData {
  conversation_id: string
  role: AIMessage['role']
  content: string
  tokens_used?: number
  model_used?: string
  response_time_ms?: number
  metadata?: Record<string, any>
}

export interface CommunityInsight {
  id: string
  insight_type: 'trend' | 'recommendation' | 'alert' | 'summary'
  category: 'fund' | 'events' | 'economy' | 'environment' | 'community'
  title: string
  description: string
  data: Record<string, any>
  confidence_score?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'active' | 'dismissed' | 'acted_upon'
  generated_at: string
  expires_at?: string
  viewed_by: string[]
  metadata?: Record<string, any>
  // Computed fields
  is_expired?: boolean
  is_new?: boolean
  view_count?: number
  // Related data
  related_entities?: any[]
}

export interface CreateCommunityInsightData {
  insight_type: CommunityInsight['insight_type']
  category: CommunityInsight['category']
  title: string
  description: string
  data: Record<string, any>
  confidence_score?: number
  priority?: CommunityInsight['priority']
  expires_at?: string
  metadata?: Record<string, any>
}

export interface UpdateCommunityInsightData {
  status?: CommunityInsight['status']
  viewed_by?: string[]
  metadata?: Record<string, any>
}

export interface AIRecommendation {
  id: string
  user_id: string
  recommendation_type: 'event' | 'business' | 'proposal' | 'project' | 'action'
  target_id?: string
  target_type?: string
  title: string
  description: string
  reasoning?: string
  confidence_score?: number
  relevance_score?: number
  status: 'pending' | 'viewed' | 'accepted' | 'dismissed'
  expires_at?: string
  created_at: string
  metadata?: Record<string, any>
  // Computed fields
  is_expired?: boolean
  is_new?: boolean
  // Related data
  user_profile?: UserProfile
  target_entity?: any
}

export interface CreateAIRecommendationData {
  user_id: string
  recommendation_type: AIRecommendation['recommendation_type']
  target_id?: string
  target_type?: string
  title: string
  description: string
  reasoning?: string
  confidence_score?: number
  relevance_score?: number
  expires_at?: string
  metadata?: Record<string, any>
}

export interface UpdateAIRecommendationData {
  status?: AIRecommendation['status']
  metadata?: Record<string, any>
}

export interface AIAnalytics {
  id: string
  event_type: 'conversation_started' | 'message_sent' | 'insight_generated' | 'recommendation_clicked'
  user_id?: string
  conversation_id?: string
  insight_id?: string
  recommendation_id?: string
  event_data?: Record<string, any>
  created_at: string
}

export interface CreateAIAnalyticsData {
  event_type: AIAnalytics['event_type']
  user_id?: string
  conversation_id?: string
  insight_id?: string
  recommendation_id?: string
  event_data?: Record<string, any>
}

export interface AIKnowledgeBase {
  id: string
  category: string
  title: string
  content: string
  tags: string[]
  source_type?: 'manual' | 'community_data' | 'external_api'
  source_id?: string
  last_updated: string
  created_at: string
  metadata?: Record<string, any>
  // Computed fields
  relevance_score?: number
  usage_count?: number
}

export interface CreateAIKnowledgeBaseData {
  category: string
  title: string
  content: string
  tags?: string[]
  source_type?: AIKnowledgeBase['source_type']
  source_id?: string
  metadata?: Record<string, any>
}

export interface UpdateAIKnowledgeBaseData {
  category?: string
  title?: string
  content?: string
  tags?: string[]
  source_type?: AIKnowledgeBase['source_type']
  source_id?: string
  metadata?: Record<string, any>
}

export interface ConversationFilters {
  context_type?: AIConversation['context_type'][]
  status?: AIConversation['status'][]
  user_id?: string
  context_id?: string
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'last_message_at' | 'message_count'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface InsightFilters {
  insight_type?: CommunityInsight['insight_type'][]
  category?: CommunityInsight['category'][]
  priority?: CommunityInsight['priority'][]
  status?: CommunityInsight['status'][]
  generated_from?: string
  generated_to?: string
  search?: string
  sort_by?: 'generated_at' | 'priority' | 'confidence_score'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface RecommendationFilters {
  recommendation_type?: AIRecommendation['recommendation_type'][]
  status?: AIRecommendation['status'][]
  user_id?: string
  target_type?: string
  confidence_min?: number
  relevance_min?: number
  search?: string
  sort_by?: 'created_at' | 'confidence_score' | 'relevance_score'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

export interface AIMetrics {
  total_conversations: number
  active_conversations: number
  total_messages: number
  total_insights: number
  active_insights: number
  total_recommendations: number
  pending_recommendations: number
  average_response_time: number
  user_engagement: {
    daily_active_users: number
    weekly_active_users: number
    monthly_active_users: number
  }
  insight_categories: Array<{
    category: string
    count: number
    percentage: number
  }>
  recommendation_acceptance_rate: number
  monthly_activity: Array<{
    month: string
    conversations: number
    messages: number
    insights: number
    recommendations: number
  }>
}

// Supporting types
export interface UserProfile {
  id: string
  name?: string
  avatar_url?: string
  email?: string
}

// Chat interface types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isLoading?: boolean
  error?: string
}

export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
  conversationId?: string
}

// AI service types
export interface AIServiceConfig {
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface AIResponse {
  content: string
  tokens_used: number
  model_used: string
  response_time_ms: number
  confidence?: number
  metadata?: Record<string, any>
}

// Insight generation types
export interface InsightGenerationRequest {
  category: CommunityInsight['category']
  data_sources: string[]
  time_range?: {
    start: string
    end: string
  }
  filters?: Record<string, any>
}

export interface InsightGenerationResponse {
  insights: CommunityInsight[]
  metadata: {
    data_points_analyzed: number
    processing_time_ms: number
    confidence_threshold: number
  }
}

// Recommendation engine types
export interface RecommendationRequest {
  user_id: string
  context?: {
    current_page?: string
    recent_activity?: string[]
    preferences?: Record<string, any>
  }
  recommendation_types?: AIRecommendation['recommendation_type'][]
  limit?: number
}

export interface RecommendationResponse {
  recommendations: AIRecommendation[]
  metadata: {
    total_candidates: number
    filtering_criteria: string[]
    ranking_factors: string[]
  }
}
