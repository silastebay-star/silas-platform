/**
 * Floating Navigation Bar Component
 * Compact floating navigation that replaces the traditional header
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Bell, User, Bot, Plus, Menu, Map, Users, BarChart3, Command, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface FloatingNavbarProps {
  currentView: 'map' | 'social' | 'data'
  onViewChange: (view: 'map' | 'social' | 'data') => void
  onAddPin: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
  className?: string
}

export default function FloatingNavbar({
  currentView,
  onViewChange,
  onAddPin,
  searchQuery,
  onSearchChange,
  className = ""
}: FloatingNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [notifications] = useState([
    { id: 1, title: 'New comment on your pin', time: '2m ago', unread: true },
    { id: 2, title: 'Pin approved by moderator', time: '1h ago', unread: true },
    { id: 3, title: 'Weekly community digest', time: '1d ago', unread: false }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  const viewModes = [
    { id: 'map' as const, label: 'Map', icon: Map, description: 'Explore pins on the map' },
    { id: 'social' as const, label: 'Social', icon: Users, description: 'Community feed and discussions' },
    { id: 'data' as const, label: 'Data', icon: BarChart3, description: 'Analytics and insights' }
  ]

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
      }
    }

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isMenuOpen])

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
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/50 shadow-2xl px-4 py-3 min-w-[600px] max-w-[800px]">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo and Menu */}
            <div className="flex items-center space-x-3">
              {/* Menu Button */}
              <div ref={menuRef} className="relative">
                <Button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  {isMenuOpen ? (
                    <X className="h-4 w-4" />
                  ) : (
                    <Menu className="h-4 w-4" />
                  )}
                </Button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute top-10 left-0 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200/50 shadow-2xl p-4 min-w-[280px] animate-in slide-in-from-top-2 duration-300">
                    {/* View Mode Toggle */}
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Views</h3>
                      <div className="grid grid-cols-1 gap-1">
                        {viewModes.map(mode => {
                          const Icon = mode.icon
                          return (
                            <button
                              key={mode.id}
                              onClick={() => {
                                onViewChange(mode.id)
                                setIsMenuOpen(false)
                              }}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left w-full",
                                currentView === mode.id
                                  ? "bg-silas-green/10 text-silas-green border border-silas-green/20"
                                  : "text-gray-700 hover:bg-gray-100/50"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium text-sm">{mode.label}</div>
                                <div className="text-xs text-gray-500">{mode.description}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t border-gray-200/50 pt-3">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            onAddPin()
                            setIsMenuOpen(false)
                          }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100/50 transition-colors w-full text-left"
                        >
                          <Plus className="h-4 w-4 text-silas-green" />
                          <span className="text-sm">Add Pin</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Logo */}
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-silas-green rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="font-bold text-lg text-gray-900 font-heading hidden sm:block">
                  SILAS
                </span>
              </div>
            </div>

            {/* Center Section - Search */}
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search pins, places, or topics..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                  className="pl-10 pr-12 bg-gray-50/50 border-gray-200/50 focus:bg-white h-9 text-sm"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
                    <Command className="w-2.5 h-2.5 mr-0.5" />
                    K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2">
              {/* Add Pin Button */}
              <Button
                variant="default"
                onClick={onAddPin}
                className="bg-silas-green hover:bg-silas-green/90 text-white h-8 px-3"
                size="sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline text-sm">Add</span>
              </Button>

              {/* AI Assistant */}
              <Popover open={showAIAssistant} onOpenChange={setShowAIAssistant}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <Bot className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b">
                    <h3 className="font-medium text-gray-900">AI Assistant</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Ask me about the community or get insights
                    </p>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="space-y-2">
                      <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="font-medium text-sm text-gray-900">
                          &quot;Show me recent community projects&quot;
                        </div>
                        <div className="text-xs text-gray-500">
                          Find pins related to community initiatives
                        </div>
                      </button>

                      <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="font-medium text-sm text-gray-900">
                          &quot;What&apos;s happening near me?&quot;
                        </div>
                        <div className="text-xs text-gray-500">
                          Discover local events and activities
                        </div>
                      </button>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <Input
                        type="text"
                        placeholder="Ask me anything..."
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative hover:bg-gray-100">
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
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-3 border-b">
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
                          <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-gray-300'}`} />
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
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                    <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-600" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="">
                  <div className="p-3 border-b">
                    <p className="font-medium text-gray-900">Community Member</p>
                    <p className="text-sm text-gray-500">member@community.org</p>
                  </div>
                  
                  <DropdownMenuItem className="" inset={false}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem className="" inset={false}>
                    My Pins
                  </DropdownMenuItem>

                  <DropdownMenuItem className="" inset={false}>
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
