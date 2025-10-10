/**
 * AI Copilot Page
 */

'use client'
import UnifiedFloatingNav from '@/components/navigation/UnifiedFloatingNav'
import { SilasCard, SilasEmptyState } from '@/components/ui/silas-components'
import { Bot } from 'lucide-react'



export default function AIPage() {
  const aiCapabilities = [
    { 
      title: "Community Insights", 
      description: "Analyze community trends, participation patterns, and engagement metrics",
      example: "Which neighborhoods are most active in community projects?"
    },
    { 
      title: "Smart Recommendations", 
      description: "Get personalized suggestions for community involvement and connections",
      example: "Suggest local volunteer opportunities based on my interests"
    },
    { 
      title: "Resource Optimization", 
      description: "Help optimize resource allocation and project planning",
      example: "What's the best location for a new community garden?"
    },
    { 
      title: "Meeting Assistance", 
      description: "Provide summaries, action items, and follow-up suggestions",
      example: "Summarize key decisions from the last town hall meeting"
    }
  ]

  const mockConversation = [
    { role: "user", message: "What community projects need volunteers this month?" },
    { role: "ai", message: "I found 3 active projects seeking volunteers:\n\n🌱 Community Garden - Needs 5 people for weekend maintenance\n🏠 Housing Committee - Looking for 2 research volunteers\n🚲 Bike Path Project - Needs help with community surveys\n\nWould you like details about any of these?" },
    { role: "user", message: "Tell me more about the garden project" },
    { role: "ai", message: "The Community Garden project is located on Maple Street and needs volunteers every Saturday 9-11am. They're currently preparing plots for spring planting. Skills needed: basic gardening, no experience required. Contact Sarah at community.garden@stoneclough.org" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedFloatingNav showSearch={false} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Empty State */}
          <SilasCard className="lg:col-span-3">
            <SilasEmptyState
              icon={Bot}
              title="AI Copilot Coming Soon"
              description="We're developing an intelligent assistant to help you navigate community engagement, discover opportunities, and make data-informed decisions for our community's growth."
            />
          </SilasCard>
          
          {/* AI Capabilities */}
          <div className="lg:col-span-2">
            <SilasCard title="AI Capabilities" description="What your AI assistant will help you with">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiCapabilities.map((capability, index) => (
                  <div key={index} className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50/30">
                    <h4 className="font-semibold text-gray-900 mb-2">{capability.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{capability.description}</p>
                    <div className="p-2 bg-blue-50 rounded text-xs text-blue-700 italic">
                      "{capability.example}"
                    </div>
                  </div>
                ))}
              </div>
            </SilasCard>
          </div>

          {/* Mock Conversation */}
          <div>
            <SilasCard title="Preview: AI Conversation" description="Example interaction with your AI assistant">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mockConversation.map((message, index) => (
                  <div key={index} className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-silas-green/10 ml-6' : 'bg-gray-100 mr-6'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {message.role === 'user' ? (
                        <div className="w-4 h-4 bg-silas-green rounded-full"></div>
                      ) : (
                        <Bot className="w-4 h-4 text-purple-600" />
                      )}
                      <span className="text-xs font-medium text-gray-500 capitalize">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{message.message}</p>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700">
                    🤖 This conversation preview shows how the AI will help you discover community opportunities
                  </p>
                </div>
              </div>
            </SilasCard>
          </div>
        </div>
      </main>
    </div>
  )
}
