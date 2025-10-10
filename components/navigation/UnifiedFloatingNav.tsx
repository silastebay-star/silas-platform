/**
 * Unified Floating Navigation for SILAS Platform
 * Replaces MainNavigation with a consistent floating nav experience
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Search, 
  Bell, 
  User, 
  Bot, 
  Plus, 
  Menu, 
  X,
  Command,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Leaf,
  Building2,
  Home,
  Settings,
  ChevronRight,
  Sparkles,
  Wrench,
  GraduationCap,
  Scale,
  Palette
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  comingSoon?: boolean
  color?: string
}

const navigationItems: NavigationItem[] = [
  {
    id: 'map',
    label: 'Community Map',
    href: '/',
    icon: MapPin,
    description: 'Explore and contribute to your local community',
    color: '#059669'
  },
  {
    id: 'fund',
    label: 'Community Fund',
    href: '/fund',
    icon: DollarSign,
    description: 'Democratic funding for community projects',
    color: '#10B981'
  },
  {
    id: 'groups',
    label: 'Groups',
    href: '/groups',
    icon: Users,
    description: 'Find and join community groups',
    color: '#6B8E6B',
    comingSoon: true
  },
  {
    id: 'housing',
    label: 'Housing',
    href: '/housing',
    icon: Home,
    description: 'Housing and community life resources',
    color: '#F97316',
    comingSoon: true
  },
  {
    id: 'culture',
    label: 'Culture',
    href: '/culture',
    icon: Palette,
    description: 'Discover and celebrate local arts and culture',
    color: '#A855F7',
    comingSoon: true
  },
  {
    id: 'economy',
    label: 'Local Economy',
    href: '/economy',
    icon: Building2,
    description: 'Support local businesses and economy',
    color: '#10B981',
    comingSoon: true
  },
  {
    id: 'environment',
    label: 'Environment',
    href: '/environment',
    icon: Leaf,
    description: 'Track sustainability and green initiatives',
    color: '#059669',
    comingSoon: true
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    href: '/infrastructure',
    icon: Wrench,
    description: 'Propose and track local infrastructure projects',
    color: '#64748B',
    comingSoon: true
  },
  {
    id: 'education',
    label: 'Education',
    href: '/education',
    icon: GraduationCap,
    description: 'Foster community learning and skill sharing',
    color: '#3B82F6',
    comingSoon: true
  },
  {
    id: 'governance',
    label: 'Governance',
    href: '/governance',
    icon: Scale,
    description: 'Participate in community decision-making',
    color: '#4F46E5',
    comingSoon: true
  },
  {
    id: 'ai',
    label: 'AI Copilot',
    href: '/ai',
    icon: Bot,
    description: 'Get AI-powered community insights',
    color: '#8B5CF6',
    comingSoon: true
  }
]

interface UnifiedFloatingNavProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  showSearch?: boolean
  showQuickActions?: boolean
  className?: string
  onAddPin?: () => void
}

export default function UnifiedFloatingNav({
  searchQuery = "",
  onSearchChange = () => {},
  showSearch = true,
  showQuickActions = true,
  className = "",
  onAddPin
}: UnifiedFloatingNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const [notifications] = useState([
    { id: 1, title: 'New comment on your pin', time: '2m ago', unread: true },
    { id: 2, title: 'Pin approved by moderator', time: '1h ago', unread: true },
    { id: 3, title: 'Weekly community digest', time: '1d ago', unread: false }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const getCurrentPage = () => {
    const current = navigationItems.find(item => isActive(item.href))
    return current || navigationItems[0]
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setShowAIAssistant(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <>
      {/* Backdrop overlay when menu is open */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Floating navigation bar */}
      <div
        className={cn(
          "fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out",
          className
        )}
      >
        <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-2xl px-4 py-3 min-w-[600px] max-w-[900px]">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo and Navigation */}
            <div className="flex items-center space-x-3">
              {/* Navigation Menu */}
              <div ref={menuRef} className="relative">
                <Button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100/80"
                >
                  {isMenuOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </Button>

                {/* Navigation Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute top-10 left-0 bg-white/96 backdrop-blur-md rounded-xl border border-gray-200/60 shadow-2xl p-6 min-w-[320px] animate-in slide-in-from-top-2 duration-300">
                    {/* Current Page Header */}
                    <div className="mb-4 pb-4 border-b border-gray-200/60">
                      <div className="flex items-center gap-3">
                        {React.createElement(getCurrentPage().icon, { className: "h-5 w-5 text-silas-green" })}
                        <div>
                          <h3 className="font-semibold text-gray-900">{getCurrentPage().label}</h3>
                          <p className="text-xs text-gray-500">{getCurrentPage().description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Navigate to</h4>
                      {navigationItems.map(item => {
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
                              setIsMenuOpen(false)
                            }}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg transition-all duration-200 group",
                              active
                                ? "bg-silas-green/10 text-silas-green border border-silas-green/20"
                                : "text-gray-700 hover:bg-gray-100/60",
                              item.comingSoon && "opacity-60"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium text-sm">{item.label}</div>
                                <div className="text-xs text-gray-500">{item.description}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.comingSoon && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  Soon
                                </Badge>
                              )}
                              {!active && !item.comingSoon && (
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>

                    {/* Quick Actions */}
                    {showQuickActions && (
                      <div className="border-t border-gray-200/60 pt-4 mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
                        <div className="space-y-1">
                          {onAddPin && (
                            <button
                              onClick={() => {
                                onAddPin()
                                setIsMenuOpen(false)
                              }}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100/60 transition-colors w-full text-left"
                            >
                              <Plus className="h-4 w-4 text-silas-green" />
                              <span className="text-sm">Add Community Pin</span>
                            </button>
                          )}
                          <Link
                            href="/settings"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100/60 transition-colors"
                          >
                            <Settings className="h-4 w-4 text-gray-600" />
                            <span className="text-sm">Settings</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                <div className="w-7 h-7 bg-gradient-to-br from-silas-green to-green-600 rounded-lg flex items-center justify-center group-hover:shadow-md transition-all">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-lg text-gray-900 font-heading hidden sm:block group-hover:text-silas-green transition-colors">
                  SILAS
                </span>
              </Link>
            </div>

            {/* Center Section - Search */}
            {showSearch && (
              <div className="flex-1 max-w-md mx-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search community content..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                    className="pl-10 pr-12 bg-gray-50/60 border-gray-200/60 focus:bg-white/80 h-9 text-sm backdrop-blur-sm"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100/80 border border-gray-200/60 rounded backdrop-blur-sm">
                      <Command className="w-2.5 h-2.5 mr-0.5" />
                      K
                    </kbd>
                  </div>
                </div>
              </div>
            )}

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2">
              {/* Add Action Button */}
              {showQuickActions && onAddPin && (
                <Button
                  variant="default"
                  onClick={onAddPin}
                  className="bg-silas-green hover:bg-silas-green/90 text-white h-8 px-3 shadow-sm"
                  size="sm"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span className="hidden sm:inline text-sm">Add</span>
                </Button>
              )}

              {/* AI Assistant */}
              <Popover open={showAIAssistant} onOpenChange={setShowAIAssistant}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100/80 relative">
                    <Bot className="w-4 h-4" />
                    <Sparkles className="w-2 h-2 absolute -top-0.5 -right-0.5 text-purple-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 border-gray-200/60 backdrop-blur-md" align="end">
                  <div className="p-4 border-b border-gray-200/60">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      AI Assistant
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Ask me about the community or get insights
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50/80 transition-colors border border-gray-200/40">
                        <div className="font-medium text-sm text-gray-900">
                          "Show me recent community projects"
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Find pins related to community initiatives
                        </div>
                      </button>

                      <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50/80 transition-colors border border-gray-200/40">
                        <div className="font-medium text-sm text-gray-900">
                          "What's happening near me?"
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Discover local events and activities
                        </div>
                      </button>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200/60">
                      <Input
                        type="text"
                        placeholder="Ask me anything..."
                        className="text-sm h-8 bg-gray-50/60"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative hover:bg-gray-100/80">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 w-4 h-4 text-xs p-0 flex items-center justify-center"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 border-gray-200/60 backdrop-blur-md">
                  <div className="p-3 border-b border-gray-200/60">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="text-xs text-gray-500">
                          Mark all read
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notification => (
                      <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer" inset={false}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-silas-green' : 'bg-gray-300'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  
                  <DropdownMenuSeparator className="" />
                  <DropdownMenuItem className="p-3 text-center text-sm text-gray-500" inset={false}>
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100/80">
                    <div className="w-5 h-5 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-gray-200/60 backdrop-blur-md">
                  <div className="p-3 border-b border-gray-200/60">
                    <p className="font-medium text-gray-900">Community Member</p>
                    <p className="text-sm text-gray-500">member@community.org</p>
                  </div>
                  
                  <DropdownMenuItem className="" inset={false}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem className="" inset={false}>
                    My Contributions
                  </DropdownMenuItem>

                  <DropdownMenuItem className="" inset={false}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="" />

                  <DropdownMenuItem className="text-red-600" inset={false}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}