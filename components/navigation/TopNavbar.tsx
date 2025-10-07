'use client'

import { useState } from 'react'
import { Search, Bell, User, Bot, Plus, Menu, Map, Users, BarChart3, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface TopNavbarProps {
  currentView: 'map' | 'social' | 'data'
  onViewChange: (view: 'map' | 'social' | 'data') => void
  onAddPin: () => void
  onToggleSidebar: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function TopNavbar({
  currentView,
  onViewChange,
  onAddPin,
  onToggleSidebar,
  searchQuery,
  onSearchChange
}: TopNavbarProps) {
  const [showAIAssistant, setShowAIAssistant] = useState(false)
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

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-silas-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900 font-heading hidden sm:block">
              SILAS
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
            {viewModes.map(mode => {
              const Icon = mode.icon
              return (
                <Button
                  key={mode.id}
                  variant={currentView === mode.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onViewChange(mode.id)}
                  className={`
                    px-3 py-1.5 text-sm font-medium transition-all
                    ${currentView === mode.id 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                  title={mode.description}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {mode.label}
                </Button>
              )
            })}
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
              className="pl-10 pr-4 bg-gray-50 border-gray-200 focus:bg-white"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
                <Command className="w-3 h-3 mr-1" />
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Add Pin Button */}
          <Button
            variant="default"
            onClick={onAddPin}
            className="bg-silas-green hover:bg-silas-green/90 text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Add Pin</span>
          </Button>

          {/* AI Assistant */}
          <Popover open={showAIAssistant} onOpenChange={setShowAIAssistant}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bot className="w-5 h-5" />
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
                  
                  <button className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-sm text-gray-900">
                      &quot;Summarize this week&apos;s activity&quot;
                    </div>
                    <div className="text-xs text-gray-500">
                      Get a digest of recent community updates
                    </div>
                  </button>
                </div>
                
                <div className="pt-2 border-t">
                  <Input
                    type="text"
                    placeholder="Ask me anything..."
                    className="text-sm"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
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
              <Button variant="ghost" size="sm" className="relative">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
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

      {/* Mobile View Mode Toggle */}
      <div className="md:hidden mt-3 flex bg-gray-100 rounded-lg p-1">
        {viewModes.map(mode => {
          const Icon = mode.icon
          return (
            <Button
              key={mode.id}
              variant={currentView === mode.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(mode.id)}
              className={`
                flex-1 px-3 py-1.5 text-sm font-medium transition-all
                ${currentView === mode.id 
                  ? 'bg-white shadow-sm text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Icon className="w-4 h-4 mr-1.5" />
              {mode.label}
            </Button>
          )
        })}
      </div>
    </header>
  )
}
