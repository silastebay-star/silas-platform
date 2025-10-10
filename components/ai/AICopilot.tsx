/**
 * AI Copilot Component
 * Intelligent assistant for community management and decision-making
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bot, 
  Brain,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Users,
  MapPin,
  Calendar,
  Target,
  Zap,
  MessageSquare,
  Send,
  Mic,
  MicOff,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Settings,
  Sparkles,
  FileText,
  Image,
  Video,
  Download,
  Share,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  HelpCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AIMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: {
    confidence?: number
    sources?: string[]
    suggestions?: string[]
    actions?: AIAction[]
  }
}

interface AIAction {
  id: string
  type: 'create_pin' | 'schedule_meeting' | 'generate_report' | 'send_notification' | 'analyze_data'
  title: string
  description: string
  parameters: Record<string, any>
  status: 'pending' | 'completed' | 'failed'
}

interface AIInsight {
  id: string
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  category: string
  data_sources: string[]
  suggested_actions: string[]
  created_at: string
}

interface SmartRecommendation {
  id: string
  title: string
  description: string
  type: 'project' | 'policy' | 'engagement' | 'resource' | 'collaboration'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  reasoning: string
  expected_impact: string
  implementation_steps: string[]
  resources_needed: string[]
  timeline: string
  success_metrics: string[]
}

interface AICopilotProps {
  context?: {
    pinId?: string
    projectId?: string
    userId?: string
    location?: { latitude: number; longitude: number }
  }
  className?: string
}

export default function AICopilot({ context, className }: AICopilotProps) {
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [selectedMode, setSelectedMode] = useState<'general' | 'analysis' | 'planning' | 'engagement'>('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAIData()
    initializeChat()
  }, [context])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchAIData = async () => {
    try {
      const [insightsRes, recommendationsRes] = await Promise.all([
        fetch('/api/ai/insights'),
        fetch('/api/ai/recommendations')
      ])

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json()
        setInsights(insightsData)
      }

      if (recommendationsRes.ok) {
        const recommendationsData = await recommendationsRes.json()
        setRecommendations(recommendationsData)
      }
    } catch (error) {
      console.error('Error fetching AI data:', error)
    }
  }

  const initializeChat = () => {
    const welcomeMessage: AIMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `Hello! I'm your AI Copilot for community management. I can help you with:

• **Data Analysis**: Analyze community trends and patterns
• **Smart Recommendations**: Suggest projects and initiatives
• **Planning Assistance**: Help plan events and projects
• **Engagement Strategies**: Improve community participation
• **Report Generation**: Create insights and summaries

What would you like to explore today?`,
      timestamp: new Date().toISOString(),
      metadata: {
        confidence: 1.0,
        suggestions: [
          "Analyze recent community activity",
          "Suggest new project ideas",
          "Review engagement metrics",
          "Generate monthly report"
        ]
      }
    }
    setMessages([welcomeMessage])
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputMessage,
          mode: selectedMode,
          context,
          conversation_history: messages.slice(-10) // Last 10 messages for context
        })
      })

      if (response.ok) {
        const aiResponse = await response.json()
        const assistantMessage: AIMessage = {
          id: Date.now().toString() + '_ai',
          type: 'assistant',
          content: aiResponse.content,
          timestamp: new Date().toISOString(),
          metadata: aiResponse.metadata
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: AIMessage = {
        id: Date.now().toString() + '_error',
        type: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const executeAction = async (action: AIAction) => {
    try {
      const response = await fetch('/api/ai/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      })

      if (response.ok) {
        // Update action status or refresh data
        console.log('Action executed successfully:', action)
      }
    } catch (error) {
      console.error('Error executing action:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return <TrendingUp className="w-5 h-5 text-blue-600" />
      case 'anomaly': return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-green-600" />
      case 'risk': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'recommendation': return <Target className="w-5 h-5 text-purple-600" />
      default: return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'border-l-blue-500 bg-blue-50'
      case 'anomaly': return 'border-l-orange-500 bg-orange-50'
      case 'opportunity': return 'border-l-green-500 bg-green-50'
      case 'risk': return 'border-l-red-500 bg-red-50'
      case 'recommendation': return 'border-l-purple-500 bg-purple-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-silas-green" />
                <span>AI Copilot</span>
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </CardTitle>
              <CardDescription>
                Your intelligent assistant for community management and decision-making
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedMode} onValueChange={(value: any) => setSelectedMode(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="analysis">Analysis</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">AI Chat</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card className="h-96">
            <CardContent className="p-0 h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.type === 'user'
                          ? 'bg-silas-green text-white'
                          : message.type === 'system'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {message.metadata?.suggestions && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs opacity-75">Suggestions:</p>
                          {message.metadata.suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => setInputMessage(suggestion)}
                              className="block w-full text-left text-xs p-2 rounded bg-white/20 hover:bg-white/30 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {message.metadata?.actions && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs opacity-75">Suggested Actions:</p>
                          {message.metadata.actions.map(action => (
                            <button
                              key={action.id}
                              onClick={() => executeAction(action)}
                              className="block w-full text-left text-xs p-2 rounded bg-white/20 hover:bg-white/30 transition-colors"
                            >
                              <div className="font-medium">{action.title}</div>
                              <div className="opacity-75">{action.description}</div>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                        <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
                        {message.metadata?.confidence && (
                          <span>Confidence: {Math.round(message.metadata.confidence * 100)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-silas-green" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Ask me anything about your community..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsListening(!isListening)}
                    className={isListening ? 'bg-red-100' : ''}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-silas-green hover:bg-silas-green/90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map(insight => (
              <Card key={insight.id} className={cn("border-l-4", getInsightColor(insight.type))}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{insight.title}</h3>
                        <p className="text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={cn(
                        insight.impact === 'high' ? 'bg-red-500' :
                        insight.impact === 'medium' ? 'bg-orange-500' : 'bg-green-500',
                        'text-white'
                      )}>
                        {insight.impact} impact
                      </Badge>
                      <Badge variant="outline">
                        {insight.confidence}% confidence
                      </Badge>
                    </div>
                  </div>

                  {insight.suggested_actions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Suggested Actions:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {insight.suggested_actions.map((action, index) => (
                          <li key={index}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Sources:</span>
                      {insight.data_sources.map(source => (
                        <Badge key={source} variant="outline" className="text-xs">
                          {source}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="capitalize">
                        {insight.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {format(new Date(insight.created_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {insights.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                  <p className="text-gray-600">
                    AI insights will appear here as data is analyzed
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map(rec => (
              <Card key={rec.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{rec.title}</h3>
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority} priority
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {rec.type}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{rec.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium mb-2">Reasoning</h4>
                          <p className="text-sm text-gray-600">{rec.reasoning}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Expected Impact</h4>
                          <p className="text-sm text-gray-600">{rec.expected_impact}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Implementation Steps</h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                            {rec.implementation_steps.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Success Metrics</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                            {rec.success_metrics.map((metric, index) => (
                              <li key={index}>{metric}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Timeline: {rec.timeline}</span>
                      <span>Resources: {rec.resources_needed.length} items</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Star className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button size="sm" className="bg-silas-green hover:bg-silas-green/90">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Implement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {recommendations.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Recommendations</h3>
                  <p className="text-gray-600">
                    AI recommendations will appear here based on your community data
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Analytics Dashboard</CardTitle>
              <CardDescription>
                Performance metrics and usage statistics for AI features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-silas-green">127</div>
                  <div className="text-sm text-gray-600">AI Interactions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">89%</div>
                  <div className="text-sm text-gray-600">Accuracy Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">23</div>
                  <div className="text-sm text-gray-600">Actions Executed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
