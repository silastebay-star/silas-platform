/**
 * AI Copilot Module
 * 
 * Handles AI-powered community assistance and insights
 */

export { default as AICopilot } from './components/AICopilot'
export { default as CommunityInsights } from './components/CommunityInsights'
export { default as SmartRecommendations } from './components/SmartRecommendations'

export { useAIAssistant } from './hooks/useAIAssistant'
export { useCommunityInsights } from './hooks/useCommunityInsights'

export type {
  AIConversation,
  CreateAIConversationData,
  UpdateAIConversationData,
  AIMessage,
  CreateAIMessageData,
  CommunityInsight,
  CreateCommunityInsightData,
  UpdateCommunityInsightData,
  AIRecommendation,
  CreateAIRecommendationData,
  UpdateAIRecommendationData,
  AIAnalytics,
  AIKnowledgeBase,
  ConversationFilters,
  InsightFilters,
  RecommendationFilters,
  AIMetrics,
  ChatMessage,
  ChatState,
  AIResponse
} from './types'
