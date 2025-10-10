/**
 * Enhanced Floating Action Buttons and Widgets for SILAS Platform
 * Context-aware quick access tools with improved animations and positioning
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useNavigationStore, useModalState } from '@/store/navigation'
import {
  Plus,
  MessageSquare,
  Bell,
  Users,
  Calendar,
  MapPin,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  TrendingUp,
  Activity,
  Heart,
  Share2,
  Filter,
  Search,
  Bookmark,
  Settings,
  HelpCircle,
  Zap,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react'

interface FloatingActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  className?: string
  badge?: number
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  pulse?: boolean
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  className = "",
  badge,
  color = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  pulse = false
}: FloatingActionButtonProps) {
  const colorClasses = {
    primary: 'bg-silas-green hover:bg-silas-green/90 text-white shadow-silas-green/25',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-gray-600/25',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/25',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-yellow-600/25',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25'
  }

  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-14 w-14'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className="relative"
          >
            <Button
              variant="default"
              onClick={onClick}
              disabled={disabled || loading}
              className={cn(
                'rounded-full shadow-lg hover:shadow-xl transition-all duration-200',
                sizeClasses[size],
                colorClasses[color],
                pulse && 'animate-pulse',
                disabled && 'opacity-50 cursor-not-allowed',
                className
              )}
              size="default"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className={iconSizes[size]}
                >
                  <Sparkles className="h-full w-full" />
                </motion.div>
              ) : (
                <Icon className={iconSizes[size]} />
              )}
            </Button>

            <AnimatePresence>
              {badge !== undefined && badge > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2"
                >
                  <Badge
                    variant="destructive"
                    className="h-6 w-6 flex items-center justify-center p-0 text-xs font-bold"
                  >
                    {badge > 99 ? '99+' : badge}
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-gray-900 text-white border-gray-700">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface QuickStatsWidgetProps {
  className?: string
  stats?: Array<{
    label: string
    value: string
    icon: React.ComponentType<{ className?: string }>
    trend?: string
    color?: string
  }>
}

export function QuickStatsWidget({
  className = "",
  stats: customStats
}: QuickStatsWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  // Context-aware stats based on current page
  const getContextualStats = () => {
    if (pathname.startsWith('/map')) {
      return [
        { label: 'Active Pins', value: '127', icon: MapPin, trend: '+8', color: 'text-silas-green' },
        { label: 'Contributors', value: '45', icon: Users, trend: '+3', color: 'text-blue-600' },
        { label: 'This Week', value: '23', icon: Activity, trend: '+12', color: 'text-green-600' },
        { label: 'Engagement', value: '89%', icon: TrendingUp, trend: '+5%', color: 'text-purple-600' }
      ]
    } else if (pathname.startsWith('/fund')) {
      return [
        { label: 'Active Projects', value: '12', icon: Activity, trend: '+2', color: 'text-silas-green' },
        { label: 'Total Funding', value: '£24.5k', icon: TrendingUp, trend: '+£2.1k', color: 'text-green-600' },
        { label: 'Backers', value: '156', icon: Users, trend: '+18', color: 'text-blue-600' },
        { label: 'Success Rate', value: '78%', icon: Heart, trend: '+5%', color: 'text-red-500' }
      ]
    } else {
      return [
        { label: 'Community Score', value: '8.4', icon: Sparkles, trend: '+0.3', color: 'text-silas-green' },
        { label: 'Active Members', value: '248', icon: Users, trend: '+15', color: 'text-blue-600' },
        { label: 'Monthly Events', value: '8', icon: Calendar, trend: '+3', color: 'text-purple-600' },
        { label: 'Engagement', value: '78%', icon: TrendingUp, trend: '+5%', color: 'text-green-600' }
      ]
    }
  }

  const stats = customStats || getContextualStats()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className={cn("shadow-lg border-gray-200/60 backdrop-blur-md bg-white/95", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-silas-green" />
              Quick Stats
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronUp className="h-3 w-3" />
              </motion.div>
            </Button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", stat.color || "text-gray-500")} />
                        <span className="text-sm text-gray-600">{stat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900">{stat.value}</span>
                        {stat.trend && (
                          <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                            {stat.trend}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface RecentActivityWidgetProps {
  className?: string
}

export function RecentActivityWidget({ className = "" }: RecentActivityWidgetProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  const activities = [
    { action: 'New pin added', location: 'High Street', time: '5m ago', type: 'pin' },
    { action: 'Event scheduled', location: 'Community Garden', time: '1h ago', type: 'event' },
    { action: 'Comment posted', location: 'Town Hall Meeting', time: '2h ago', type: 'comment' }
  ]

  if (!isVisible) return null

  return (
    <Card className={cn("shadow-lg border-gray-200/60 backdrop-blur-md bg-white/95 max-w-sm", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-silas-green" />
            Recent Activity
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                activity.type === 'pin' ? 'bg-silas-green' :
                activity.type === 'event' ? 'bg-blue-500' : 'bg-yellow-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.location} • {activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface ContextualAction {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  badge?: number
  active?: boolean
}

interface FloatingWidgetsProps {
  onAddPin?: () => void
  onOpenChat?: () => void
  onShowNotifications?: () => void
  className?: string
}

export function FloatingWidgets({
  onAddPin,
  onOpenChat,
  onShowNotifications,
  className = ""
}: FloatingWidgetsProps) {
  const pathname = usePathname()
  const { preferences } = useNavigationStore()
  const { modals, open: openModal } = useModalState()

  const [showStats, setShowStats] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Don't show if disabled in preferences
  if (!preferences.floatingWidgetsEnabled) return null

  // Context-aware actions based on current page
  const getContextualActions = (): ContextualAction[] => {
    const baseActions = [
      {
        icon: TrendingUp,
        label: "Quick Stats",
        onClick: () => setShowStats(!showStats),
        color: "secondary" as const,
        size: "md" as const,
        active: showStats
      },
      {
        icon: Activity,
        label: "Recent Activity",
        onClick: () => setShowActivity(!showActivity),
        color: "secondary" as const,
        size: "md" as const,
        active: showActivity
      }
    ]

    if (pathname.startsWith('/map')) {
      return [
        ...baseActions,
        {
          icon: Filter,
          label: "Filters",
          onClick: () => openModal('search'),
          color: "secondary" as const,
          size: "md" as const
        },
        {
          icon: Search,
          label: "Search",
          onClick: () => openModal('search'),
          color: "secondary" as const,
          size: "md" as const
        }
      ]
    } else if (pathname.startsWith('/fund')) {
      return [
        ...baseActions,
        {
          icon: Bookmark,
          label: "Saved Projects",
          onClick: () => {},
          color: "secondary" as const,
          size: "md" as const,
          badge: 3
        }
      ]
    }

    return baseActions
  }

  const contextualActions = getContextualActions()

  return (
    <div className={cn("fixed bottom-6 right-6 z-40", className)}>
      <div className="flex flex-col items-end gap-4">
        {/* Contextual Widgets */}
        <AnimatePresence>
          {showActivity && !isMobile && (
            <RecentActivityWidget className="animate-in slide-in-from-right-2 duration-300" />
          )}

          {showStats && !isMobile && (
            <QuickStatsWidget className="animate-in slide-in-from-right-2 duration-300" />
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Secondary Actions */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col gap-2"
              >
                {contextualActions.map((action, index) => (
                  <motion.div
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <FloatingActionButton
                      icon={action.icon}
                      label={action.label}
                      onClick={action.onClick}
                      color={action.color}
                      size={action.size}
                      badge={action.badge}
                      className={cn(action.active && "ring-2 ring-silas-green/50")}
                    />
                  </motion.div>
                ))}

                {onOpenChat && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: contextualActions.length * 0.05 }}
                  >
                    <FloatingActionButton
                      icon={MessageSquare}
                      label="Community Chat"
                      onClick={onOpenChat}
                      color="primary"
                      size="md"
                      badge={3}
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expand/Collapse Button */}
          <FloatingActionButton
            icon={isExpanded ? X : Plus}
            label={isExpanded ? "Close" : "Quick Actions"}
            onClick={() => setIsExpanded(!isExpanded)}
            color="secondary"
            size="md"
            className="transition-all duration-200"
          />

          {/* Primary Action */}
          {onAddPin && (
            <FloatingActionButton
              icon={Plus}
              label="Add to Community"
              onClick={onAddPin}
              color="primary"
              pulse={pathname.startsWith('/map')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Quick Action Bar for specific pages
interface QuickActionBarProps {
  actions: Array<{
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  }>
  className?: string
}

export function QuickActionBar({ actions, className = "" }: QuickActionBarProps) {
  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40",
      "bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-xl",
      "px-4 py-3 flex items-center gap-3",
      className
    )}>
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <Button
            key={index}
            variant="ghost"
            size="default"
            onClick={action.onClick}
            className="h-10 px-4 flex items-center gap-2 hover:bg-gray-100/80"
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{action.label}</span>
          </Button>
        )
      })}
    </div>
  )
}