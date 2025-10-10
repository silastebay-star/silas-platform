/**
 * Floating Header Navigation
 * Compact floating navigation bar that provides access to all overlay panels
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Bell, 
  User, 
  Settings,
  Menu,
  X,
  Plus,
  Minimize2,
  Maximize2,
  Grid3X3,
  Users,
  DollarSign,
  Calendar,
  Building2,
  Leaf,
  Bot,
  MessageSquare,
  Command,
  Home,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { usePanelStore, usePanelActions, PanelType } from '@/store/panels'
import { useNavigationStore } from '@/store/navigation'

interface PanelMenuItem {
  type: PanelType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  comingSoon?: boolean
  badge?: number
}

const panelMenuItems: PanelMenuItem[] = [
  {
    type: 'community',
    label: 'Community',
    icon: Users,
    description: 'Community discussions and updates'
  },
  {
    type: 'fund',
    label: 'Community Fund',
    icon: DollarSign,
    description: 'Democratic funding for projects'
  },
  {
    type: 'events',
    label: 'Events',
    icon: Calendar,
    description: 'Community events and activities',
    comingSoon: true
  },
  {
    type: 'economy',
    label: 'Local Economy',
    icon: Building2,
    description: 'Local business directory',
    comingSoon: true
  },
  {
    type: 'environment',
    label: 'Environment',
    icon: Leaf,
    description: 'Sustainability initiatives',
    comingSoon: true
  },
  {
    type: 'ai',
    label: 'AI Copilot',
    icon: Bot,
    description: 'AI-powered insights',
    comingSoon: true
  }
]

interface FloatingHeaderProps {
  className?: string
  onAddPin?: () => void
}

export default function FloatingHeader({ className = "", onAddPin }: FloatingHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const { openPanel } = usePanelActions()
  const { getOpenPanels, getMinimizedPanels, minimizeAllPanels, arrangeWindows, closeAllPanels } = usePanelStore()
  const { preferences } = useNavigationStore()
  
  const openPanels = getOpenPanels()
  const minimizedPanels = getMinimizedPanels()
  
  // Mock notifications
  const [notifications] = useState([
    { id: 1, title: 'New community pin added', time: '2m ago', unread: true },
    { id: 2, title: 'Funding proposal approved', time: '1h ago', unread: true },
    { id: 3, title: 'Weekly digest available', time: '1d ago', unread: false }
  ])
  
  const unreadCount = notifications.filter(n => n.unread).length
  
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
  
  const handlePanelOpen = (type: PanelType) => {
    openPanel(type)
    setIsMenuOpen(false)
  }
  
  const handleSearch = (query: string) => {
    if (query.trim()) {
      openPanel('search', {
        title: `Search: ${query}`,
        position: { x: 200, y: 120, width: 700, height: 500 }
      })
      setShowSearch(false)
      setSearchQuery('')
    }
  }
  
  return (
    <>
      {/* Main Floating Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999]",
          "bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/60 shadow-2xl",
          "px-4 py-3 min-w-[600px] max-w-[900px]",
          className
        )}
      >
        <div className="flex items-center justify-between">
          {/* Left Section - Logo and Menu */}
          <div className="flex items-center space-x-3">
            {/* Panel Menu */}
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
              
              {/* Panel Menu Dropdown */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-10 left-0 bg-white/96 backdrop-blur-md rounded-xl border border-gray-200/60 shadow-2xl p-6 min-w-[320px] z-50"
                  >
                    {/* Header */}
                    <div className="mb-4 pb-4 border-b border-gray-200/60">
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4 text-silas-green" />
                        Panels
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Open floating panels on the map
                      </p>
                    </div>
                    
                    {/* Panel Items */}
                    <div className="space-y-1 mb-4">
                      {panelMenuItems.map(item => {
                        const Icon = item.icon
                        
                        return (
                          <button
                            key={item.type}
                            onClick={() => item.comingSoon ? null : handlePanelOpen(item.type)}
                            disabled={item.comingSoon}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg transition-all duration-200 group w-full text-left",
                              item.comingSoon 
                                ? "opacity-60 cursor-not-allowed"
                                : "text-gray-700 hover:bg-gray-100/60"
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
                              {item.badge && (
                                <Badge variant="destructive" className="text-xs px-2 py-0.5">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    
                    {/* Panel Management */}
                    <div className="border-t border-gray-200/60 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Panel Management</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            arrangeWindows()
                            setIsMenuOpen(false)
                          }}
                          className="text-xs"
                        >
                          <Grid3X3 className="h-3 w-3 mr-1" />
                          Arrange
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            minimizeAllPanels()
                            setIsMenuOpen(false)
                          }}
                          className="text-xs"
                        >
                          <Minimize2 className="h-3 w-3 mr-1" />
                          Minimize All
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-br from-silas-green to-green-600 rounded-lg flex items-center justify-center">
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
                placeholder="Search community..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery)
                  }
                }}
                onFocus={() => setShowSearch(true)}
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
          
          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {/* Add Pin Button */}
            {onAddPin && (
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
            
            {/* Chat Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openPanel('chat')}
              className="h-8 w-8 p-0 hover:bg-gray-100/80"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openPanel('notifications')}
                      className="text-xs text-silas-green hover:text-silas-green/80"
                    >
                      View All
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 3).map(notification => (
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
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Profile Menu */}
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
                
                <DropdownMenuItem onClick={() => openPanel('profile')} inset={false} className="">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => openPanel('settings')} inset={false} className="">
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
      </motion.div>
      
      {/* Minimized Panels Bar */}
      <AnimatePresence>
        {minimizedPanels.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9998] bg-white/90 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-lg px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 mr-2">Minimized:</span>
              {minimizedPanels.map(panel => {
                const menuItem = panelMenuItems.find(item => item.type === panel.type)
                const Icon = menuItem?.icon || Users
                
                return (
                  <Button
                    key={panel.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => usePanelStore.getState().restorePanel(panel.id)}
                    className="h-7 px-2 text-xs"
                    title={panel.title}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {panel.title}
                  </Button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
