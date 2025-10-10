/**
 * Guest Access Prompt Component
 * Mobile-first call-to-action for unauthenticated users
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, MapPin, Users, Heart, MessageCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface GuestAccessPromptProps {
  isOpen: boolean
  onClose: () => void
  action?: 'create_pin' | 'like' | 'comment' | 'join_group' | 'general'
  className?: string
}

const ACTION_MESSAGES = {
  create_pin: {
    title: "Add Your Voice to the Community",
    description: "Share what's happening in your neighborhood by creating pins on the map.",
    icon: Plus,
    color: "text-silas-green"
  },
  like: {
    title: "Show Your Support",
    description: "Like and engage with community posts to show your support.",
    icon: Heart,
    color: "text-red-500"
  },
  comment: {
    title: "Join the Conversation",
    description: "Share your thoughts and connect with your neighbors through comments.",
    icon: MessageCircle,
    color: "text-blue-500"
  },
  join_group: {
    title: "Connect with Local Groups",
    description: "Join community groups to collaborate on projects and stay informed.",
    icon: Users,
    color: "text-purple-500"
  },
  general: {
    title: "Join the SILAS Community",
    description: "Connect with your neighbors and help build a stronger community.",
    icon: MapPin,
    color: "text-silas-green"
  }
}

const COMMUNITY_BENEFITS = [
  {
    icon: MapPin,
    title: "Share Local Updates",
    description: "Post about events, issues, and opportunities in your area"
  },
  {
    icon: Users,
    title: "Connect with Neighbors",
    description: "Join groups and collaborate on community projects"
  },
  {
    icon: Heart,
    title: "Support Local Initiatives",
    description: "Like, comment, and engage with community content"
  }
]

export default function GuestAccessPrompt({
  isOpen,
  onClose,
  action = 'general',
  className = ""
}: GuestAccessPromptProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  
  const actionConfig = ACTION_MESSAGES[action]
  const ActionIcon = actionConfig.icon

  const handleSignUp = async () => {
    setIsLoading(true)
    router.push('/auth/signup')
  }

  const handleSignIn = async () => {
    setIsLoading(true)
    router.push('/auth/signin')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md mx-4 rounded-2xl border-0 shadow-2xl",
        "bg-gradient-to-br from-white to-gray-50",
        className
      )}>
        <DialogHeader className="text-center space-y-4 pb-2">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>

          {/* Action Icon */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-silas-green to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <ActionIcon className={cn("h-8 w-8 text-white")} />
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {actionConfig.title}
            </DialogTitle>
            <p className="text-gray-600 leading-relaxed">
              {actionConfig.description}
            </p>
          </div>
        </DialogHeader>

        <CardContent className="space-y-6 pt-2">
          {/* Community Benefits */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">
              What you can do as a member:
            </h3>
            <div className="space-y-3">
              {COMMUNITY_BENEFITS.map((benefit, index) => {
                const BenefitIcon = benefit.icon
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-silas-green/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BenefitIcon className="h-4 w-4 text-silas-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {benefit.title}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Community Stats */}
          <div className="bg-gradient-to-r from-silas-green/5 to-green-100/50 rounded-xl p-4">
            <div className="text-center space-y-2">
              <h4 className="font-semibold text-gray-900 text-sm">
                Join the Stoneclough Community
              </h4>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-silas-green rounded-full"></div>
                  <span>Active Community</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Local Focus</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Real Impact</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="default"
              size="default"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-silas-green to-green-600 hover:from-silas-green/90 hover:to-green-600/90 text-white font-semibold rounded-xl shadow-lg transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </div>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Free Account
                </>
              )}
            </Button>

            <Button
              onClick={handleSignIn}
              disabled={isLoading}
              variant="outline"
              size="default"
              className="w-full h-12 border-2 border-gray-200 hover:border-silas-green hover:text-silas-green font-medium rounded-xl transition-all duration-200"
            >
              Already have an account? Sign In
            </Button>
          </div>

          {/* Privacy Note */}
          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              Free to join • Community-focused • Your privacy protected
            </p>
          </div>
        </CardContent>
      </DialogContent>
    </Dialog>
  )
}
