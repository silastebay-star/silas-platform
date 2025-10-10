/**
 * Mobile Optimizations Component
 * Enhanced mobile responsiveness and touch interactions
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { 
  Menu,
  Search,
  Filter,
  MapPin,
  Plus,
  Bell,
  User,
  Settings,
  Home,
  Calendar,
  MessageSquare,
  BarChart3,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  MoreVertical,
  Share,
  Heart,
  Bookmark,
  Flag,
  Eye,
  ThumbsUp,
  MessageCircle,
  Send,
  Camera,
  Mic,
  Image,
  Paperclip,
  Phone,
  Video,
  Navigation,
  Layers,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileOptimizationsProps {
  children?: React.ReactNode
  className?: string
}

// Mobile Navigation Component
const MobileNavigation = () => {
  const [activeTab, setActiveTab] = useState('home')
  
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: MapPin, label: 'Map' },
    { id: 'projects', icon: BarChart3, label: 'Projects' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 transition-colors",
                activeTab === item.id 
                  ? "text-silas-green bg-green-50" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Mobile Header Component
const MobileHeader = () => {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-40 md:hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle>SILAS Platform</SheetTitle>
                <SheetDescription>
                  Community collaboration platform
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <Button variant="ghost" className="w-full justify-start">
                  <Home className="w-4 h-4 mr-3" />
                  Dashboard
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-3" />
                  Community Map
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Projects
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-3" />
                  Events
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Discussions
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-3" />
                  Documents
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-3" />
                  Community
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-semibold text-silas-green">SILAS</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="w-5 h-5" />
          </Button>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search community..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(false)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Mobile Card Component with Touch Optimizations
const MobileCard = ({ 
  title, 
  description, 
  image, 
  actions, 
  onTap,
  className 
}: {
  title: string
  description: string
  image?: string
  actions?: React.ReactNode
  onTap?: () => void
  className?: string
}) => {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <Card 
      className={cn(
        "transition-all duration-150 cursor-pointer",
        isPressed ? "scale-95 shadow-sm" : "scale-100 shadow-md",
        className
      )}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={onTap}
    >
      {image && (
        <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{title}</h3>
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">{description}</p>
        
        {actions && (
          <div className="flex items-center justify-between">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Mobile Action Sheet Component
const MobileActionSheet = ({ 
  trigger, 
  title, 
  actions 
}: {
  trigger: React.ReactNode
  title: string
  actions: Array<{
    icon: React.ComponentType<any>
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive'
  }>
}) => {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <Button
                key={index}
                variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
                className="w-full justify-start h-12"
                onClick={action.onClick}
              >
                <Icon className="w-5 h-5 mr-3" />
                {action.label}
              </Button>
            )
          })}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

// Mobile Floating Action Button
const MobileFAB = ({ 
  icon: Icon, 
  onClick, 
  className 
}: {
  icon: React.ComponentType<any>
  onClick: () => void
  className?: string
}) => {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg z-40 md:hidden",
        "bg-silas-green hover:bg-silas-green/90 text-white",
        className
      )}
    >
      <Icon className="w-6 h-6" />
    </Button>
  )
}

// Mobile Swipe Gesture Component
const SwipeableCard = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight,
  className 
}: {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
}) => {
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentX(e.touches[0].clientX - startX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const threshold = 100
    if (currentX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (currentX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    
    setCurrentX(0)
    setIsDragging(false)
  }

  return (
    <div
      ref={cardRef}
      className={cn("transition-transform duration-200", className)}
      style={{ transform: `translateX(${currentX}px)` }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}

// Mobile Pull to Refresh Component
const PullToRefresh = ({ 
  onRefresh, 
  children 
}: {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}) => {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY
    const distance = currentY - startY.current

    if (distance > 0 && window.scrollY === 0) {
      setIsPulling(true)
      setPullDistance(Math.min(distance, 100))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 50 && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setIsPulling(false)
    setPullDistance(0)
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {(isPulling || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-gray-50 transition-all duration-200"
          style={{ height: `${pullDistance}px` }}
        >
          {isRefreshing ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-silas-green" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </div>
      )}
      <div style={{ transform: `translateY(${pullDistance}px)` }}>
        {children}
      </div>
    </div>
  )
}

// Main Mobile Optimizations Component
export default function MobileOptimizations({ children, className }: MobileOptimizationsProps) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      <MobileHeader />
      
      <main className="pb-20">
        {children}
      </main>
      
      <MobileNavigation />
      
      <MobileFAB
        icon={Plus}
        onClick={() => console.log('Create new item')}
      />
    </div>
  )
}

// Export individual components for use elsewhere
export {
  MobileNavigation,
  MobileHeader,
  MobileCard,
  MobileActionSheet,
  MobileFAB,
  SwipeableCard,
  PullToRefresh
}
