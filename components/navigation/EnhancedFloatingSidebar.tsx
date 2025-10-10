/**
 * Enhanced Floating Sidebar Navigation
 * Responsive, animated sidebar with contextual content and state management
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Pin,
  Search,
  Filter,
  Bookmark,
  History,
  Settings,
  Home,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Leaf,
  Bot,
  Activity,
  Heart,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useNavigationStore, useSidebarState, useSearchState, useNavigationHistory } from '@/store/navigation'
import { CategoryKey } from '@/types/silas'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  comingSoon?: boolean
  badge?: number
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
    description: 'Platform overview and community pillars'
  },
  {
    id: 'map',
    label: 'Community Map',
    href: '/map',
    icon: MapPin,
    description: 'Explore and contribute to your local community'
  },
  {
    id: 'fund',
    label: 'Community Fund',
    href: '/fund',
    icon: DollarSign,
    description: 'Democratic funding for community projects'
  },
  {
    id: 'events',
    label: 'Events',
    href: '/events',
    icon: Calendar,
    description: 'Discover and organize community events',
    comingSoon: true
  },
  {
    id: 'economy',
    label: 'Local Economy',
    href: '/economy',
    icon: Building2,
    description: 'Support local businesses and economy',
    comingSoon: true
  },
  {
    id: 'environment',
    label: 'Environment',
    href: '/environment',
    icon: Leaf,
    description: 'Track sustainability and green initiatives',
    comingSoon: true
  },
  {
    id: 'ai',
    label: 'AI Copilot',
    href: '/ai',
    icon: Bot,
    description: 'Get AI-powered community insights',
    comingSoon: true
  }
]

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  badge?: number
}

interface EnhancedFloatingSidebarProps {
  onAddPin?: () => void
  className?: string
}

export default function EnhancedFloatingSidebar({ 
  onAddPin, 
  className = "" 
}: EnhancedFloatingSidebarProps) {
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  // Navigation store state
  const { state, width, isPinned, toggle, setState, setWidth, togglePin } = useSidebarState()
  const { query, recentSearches, setQuery } = useSearchState()
  const { history, canGoBack, canGoForward, goBack, goForward } = useNavigationHistory()
  const { selectedCategories, toggleCategory, clearFilters } = useNavigationStore()
  
  // Local state
  const [searchFocused, setSearchFocused] = useState(false)
  const [activeSection, setActiveSection] = useState<'navigation' | 'search' | 'filters' | 'history'>('navigation')
  
  const isExpanded = state === 'expanded'
  const isCollapsed = state === 'collapsed'
  const isHidden = state === 'hidden'
  
  // Auto-hide on mobile when not pinned
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isPinned) {
        setState('hidden')
      }
    }
    
    window.addEventListener('resize', handleResize)
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [isPinned, setState])
  
  // Close sidebar when clicking outside (if not pinned)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isPinned && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setState('hidden')
      }
    }
    
    if (isExpanded && !isPinned) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded, isPinned, setState])
  
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }
  
  const getCurrentPage = () => {
    return navigationItems.find(item => isActive(item.href)) || navigationItems[0]
  }
  
  const quickActions: QuickAction[] = [
    {
      id: 'add-pin',
      label: 'Add Pin',
      icon: Pin,
      onClick: () => onAddPin?.()
    },
    {
      id: 'bookmarks',
      label: 'Bookmarks',
      icon: Bookmark,
      onClick: () => {},
      badge: 3
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Activity,
      onClick: () => {}
    }
  ]
  
  const sidebarVariants = {
    expanded: {
      width: width,
      opacity: 1,
      x: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
    collapsed: {
      width: 80,
      opacity: 1,
      x: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
    hidden: {
      width: 0,
      opacity: 0,
      x: -20,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    }
  }
  
  if (isHidden) return null
  
  return (
    <>
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isExpanded && !isPinned && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setState('hidden')}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <motion.div
        ref={sidebarRef}
        variants={sidebarVariants}
        animate={state}
        className={cn(
          "fixed left-4 top-20 bottom-4 z-50",
          "bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-2xl",
          "flex flex-col overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200/60">
          <div className="flex items-center justify-between">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-silas-green to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">SILAS</h2>
                  <p className="text-xs text-gray-500">{getCurrentPage().label}</p>
                </div>
              </motion.div>
            )}
            
            <div className="flex items-center gap-1">
              {/* Pin/Unpin button */}
              {isExpanded && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePin}
                  className="h-8 w-8 p-0"
                  title={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
                >
                  <Pin className={cn("h-4 w-4", isPinned && "text-silas-green")} />
                </Button>
              )}
              
              {/* Toggle button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggle}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Search bar */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="pl-10 h-9 text-sm bg-gray-50/60 border-gray-200/60 focus:bg-white/80"
                />
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {isExpanded ? (
              <>
                {/* Navigation History */}
                {history.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <History className="h-4 w-4" />
                        History
                      </h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goBack}
                          disabled={!canGoBack}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={goForward}
                          disabled={!canGoForward}
                          className="h-6 w-6 p-0"
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {history.slice(-3).map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span className="truncate">{entry.title || entry.path}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-3" />
                  </motion.div>
                )}
                
                {/* Navigation Items */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Navigation</h3>
                  <div className="space-y-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const active = isActive(item.href)
                      
                      return (
                        <Link
                          key={item.id}
                          href={item.comingSoon ? '#' : item.href}
                          onClick={(e) => {
                            if (item.comingSoon) {
                              e.preventDefault()
                              return
                            }
                            if (!isPinned) setState('hidden')
                          }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group",
                            active
                              ? "bg-silas-green/10 text-silas-green border border-silas-green/20"
                              : "text-gray-700 hover:bg-gray-100/60",
                            item.comingSoon && "opacity-60"
                          )}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{item.label}</span>
                              {item.comingSoon && (
                                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                  Soon
                                </Badge>
                              )}
                              {item.badge && (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </motion.div>
                
                <Separator className="my-2" />
                
                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
                  <div className="space-y-1">
                    {quickActions.map((action) => {
                      const Icon = action.icon
                      
                      return (
                        <button
                          key={action.id}
                          onClick={action.onClick}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100/60 transition-colors w-full text-left"
                        >
                          <Icon className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{action.label}</span>
                          {action.badge && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 ml-auto">
                              {action.badge}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </>
            ) : (
              /* Collapsed view */
              <div className="space-y-3">
                {navigationItems.slice(0, 6).map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.comingSoon ? '#' : item.href}
                      className={cn(
                        "flex items-center justify-center p-3 rounded-lg transition-all duration-200 group relative",
                        active
                          ? "bg-silas-green/10 text-silas-green"
                          : "text-gray-700 hover:bg-gray-100/60",
                        item.comingSoon && "opacity-60"
                      )}
                      title={item.label}
                    >
                      <Icon className="h-5 w-5" />
                      {item.badge && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </>
  )
}
