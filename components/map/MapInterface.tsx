/**
 * Map Interface Component
 * Main map interface with panel integration
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Plus, Users, DollarSign, Bell, User, BarChart3 } from 'lucide-react'
import { InteractiveMap } from '@/components/map/InteractiveMap'
import InteractiveLegend, { PIN_CATEGORIES } from '@/components/map/InteractiveLegend'
import GuestAccessPrompt from '@/components/auth/GuestAccessPrompt'
import CreatePinForm from '@/components/pins/CreatePinForm'
import PinCard from '@/components/pins/PinCard'
import UserProfile from '@/components/user/UserProfile'
import GroupsPanel from '@/components/groups/GroupsPanel'
import NotificationsPanel from '@/components/notifications/NotificationsPanel'
import CommunityFund from '@/components/fund/CommunityFund'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePanelManager, PANEL_CONFIGS } from '@/components/layout/PanelManager'
import { useAuth } from '@/lib/auth/auth-context'
import { useRealtime, useMapRealtime } from '@/components/providers/realtime-provider'
import pinService, { Pin, PinCategory } from '@/lib/services/pin-service'
import groupService, { Group } from '@/lib/services/group-service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const STONECLOUGH_CENTER = {
  lat: 53.5500,
  lng: -2.4833
}

export default function MapInterface() {
  const [pins, setPins] = useState<Pin[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapBounds, setMapBounds] = useState<any>(null)
  const [selectedCategories, setSelectedCategories] = useState<PinCategory[]>([])
  const [categoryStats, setCategoryStats] = useState<Record<PinCategory, number>>({
    community: 0,
    projects: 0,
    events: 0,
    economy: 0,
    environment: 0,
    safety: 0,
    faith: 0,
    data_ai: 0
  })

  const { user, isAuthenticated } = useAuth()
  const { isConnected } = useRealtime()
  const { subscribeToMapUpdates } = useMapRealtime()
  const { openPanel, closePanel, isPanelOpen } = usePanelManager()
  const router = useRouter()

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)

        // Load pins in the area
        const { pins: initialPins } = await pinService.getPins({
          location: {
            center: STONECLOUGH_CENTER,
            radius: 10 // 10km radius
          }
        }, {
          limit: 100
        })

        setPins(initialPins)

        // Calculate category stats
        const stats = initialPins.reduce((acc, pin) => {
          acc[pin.category] = (acc[pin.category] || 0) + 1
          return acc
        }, {} as Record<PinCategory, number>)

        setCategoryStats(prev => ({ ...prev, ...stats }))

        // Load user's groups if authenticated
        if (isAuthenticated && user) {
          const { groups: userGroups } = await groupService.getGroups({
            user_is_member: true
          })
          setGroups(userGroups)
        }

        // Open legend panel by default
        openPanel({
          ...PANEL_CONFIGS.legend,
          content: (
            <InteractiveLegend
              categoryStats={categoryStats}
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              onToggleAll={handleToggleAllCategories}
            />
          )
        })
      } catch (error) {
        console.error('Error loading initial data:', error)
        toast.error('Failed to load community data')
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [isAuthenticated, user, openPanel])

  // Subscribe to real-time map updates
  useEffect(() => {
    if (!mapBounds) return

    const subscription = subscribeToMapUpdates(mapBounds, (update: any) => {
      if (update.eventType === 'INSERT') {
        setPins(prev => [update.new, ...prev])
        setCategoryStats(prev => ({
          ...prev,
          [update.new.category as PinCategory]: (prev[update.new.category as PinCategory] || 0) + 1
        }))
        toast.success('New pin added to the map!')
      } else if (update.eventType === 'UPDATE') {
        setPins(prev => prev.map(pin => 
          pin.id === update.new.id ? update.new : pin
        ))
      } else if (update.eventType === 'DELETE') {
        setPins(prev => prev.filter(pin => pin.id !== update.old.id))
        setCategoryStats(prev => ({
          ...prev,
          [update.old.category as PinCategory]: Math.max(0, (prev[update.old.category as PinCategory] || 0) - 1)
        }))
      }
    })

    return () => subscription.unsubscribe()
  }, [mapBounds, subscribeToMapUpdates])

  const handleMapClick = (location: { lat: number; lng: number }) => {
    if (!isAuthenticated) {
      setShowGuestPrompt(true)
      return
    }

    openPanel({
      ...PANEL_CONFIGS.createPin,
      content: (
        <CreatePinForm
          location={location}
          groups={groups}
          onSuccess={handlePinCreated}
          onCancel={() => closePanel('create-pin')}
        />
      )
    })
  }

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin)
    openPanel({
      ...PANEL_CONFIGS.pinDetails,
      content: (
        <div className="p-4 space-y-4">
          <PinCard
            pin={pin}
            onDelete={handlePinDeleted}
            className="border-0 shadow-none"
          />
          
          {/* Additional pin details and comments would go here */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Comments</h3>
            <p className="text-sm text-gray-500">
              Comments feature coming soon...
            </p>
          </div>
        </div>
      )
    })
  }

  const handlePinCreated = (newPin: Pin) => {
    setPins(prev => [newPin, ...prev])
    setCategoryStats(prev => ({
      ...prev,
      [newPin.category]: prev[newPin.category] + 1
    }))
    closePanel('create-pin')
    toast.success('Pin created successfully!')
  }

  const handlePinDeleted = (pinId: string) => {
    const deletedPin = pins.find(p => p.id === pinId)
    if (deletedPin) {
      setPins(prev => prev.filter(p => p.id !== pinId))
      setCategoryStats(prev => ({
        ...prev,
        [deletedPin.category]: Math.max(0, prev[deletedPin.category] - 1)
      }))
    }
    closePanel('pin-details')
  }

  const handleGuestInteraction = () => {
    setShowGuestPrompt(true)
  }

  const handleCategoryToggle = (category: PinCategory) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  const handleToggleAllCategories = () => {
    if (selectedCategories.length === 0) {
      setSelectedCategories([...PIN_CATEGORIES.map(c => c.category)])
    } else {
      setSelectedCategories([])
    }
  }

  // Filter pins based on selected categories
  const filteredPins = selectedCategories.length === 0 
    ? pins 
    : pins.filter(pin => !selectedCategories.includes(pin.category))

  const handleOpenPanel = (panelType: keyof typeof PANEL_CONFIGS) => {
    if (!isAuthenticated && ['groups', 'fund', 'profile', 'notifications'].includes(panelType)) {
      handleGuestInteraction()
      return
    }

    const config = PANEL_CONFIGS[panelType]
    let content: React.ReactNode

    switch (panelType) {
      case 'groups':
        content = <GroupsPanel />
        break
      case 'fund':
        content = <CommunityFund />
        break
      case 'profile':
        content = <UserProfile />
        break
      case 'notifications':
        content = <NotificationsPanel />
        break
      case 'dataInsights':
        content = <div className="p-4">Data & Insights feature coming soon...</div>
        break
      default:
        content = <div className="p-4">Panel content</div>
    }

    openPanel({
      ...config,
      content
    })
  }

  return (
    <div className="relative w-full h-full">
      {/* Main Map */}
      <InteractiveMap
        center={STONECLOUGH_CENTER}
        pins={filteredPins}
        onPinClick={handlePinClick}
        onMapClick={handleMapClick}
        onBoundsChange={setMapBounds}
        loading={loading}
        className="w-full h-full"
      />

      {/* Guest Access Prompt */}
      <GuestAccessPrompt
        isOpen={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
        action="create_pin"
      />

      {/* Connection Status */}
      {isAuthenticated && isConnected && (
        <div className="absolute top-4 right-4 z-[8000]">
          <Card className="bg-white/95 backdrop-blur-md border-gray-200/60 shadow-lg">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Live updates active</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 right-4 z-[8000]">
        <div className="flex flex-col gap-3">
          {/* Primary Add Pin Button */}
          <Button
            variant="default"
            size="default"
            onClick={() => handleMapClick(STONECLOUGH_CENTER)}
            className={cn(
              "h-14 w-14 rounded-full shadow-xl transition-all duration-200",
              "bg-gradient-to-r from-silas-green to-green-600",
              "hover:from-silas-green/90 hover:to-green-600/90",
              "active:scale-95 touch-manipulation",
              !isAuthenticated && "animate-pulse"
            )}
            title={isAuthenticated ? "Add Pin" : "Sign up to add pins"}
          >
            <Plus className="h-6 w-6 text-white" />
          </Button>

          {/* Secondary Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="default"
              onClick={() => handleOpenPanel('groups')}
              className="h-12 w-12 rounded-full shadow-lg bg-white/95 backdrop-blur-md border-gray-200/60 touch-manipulation"
              title="Community Groups"
            >
              <Users className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="default"
              onClick={() => handleOpenPanel('fund')}
              className="h-12 w-12 rounded-full shadow-lg bg-white/95 backdrop-blur-md border-gray-200/60 touch-manipulation"
              title="Community Fund"
            >
              <DollarSign className="h-5 w-5" />
            </Button>

            {isAuthenticated && (
              <>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleOpenPanel('notifications')}
                  className="h-12 w-12 rounded-full shadow-lg bg-white/95 backdrop-blur-md border-gray-200/60 touch-manipulation"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleOpenPanel('profile')}
                  className="h-12 w-12 rounded-full shadow-lg bg-white/95 backdrop-blur-md border-gray-200/60 touch-manipulation"
                  title="Profile"
                >
                  <User className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  onClick={() => handleOpenPanel('dataInsights')}
                  className="h-12 w-12 rounded-full shadow-lg bg-white/95 backdrop-blur-md border-gray-200/60 touch-manipulation"
                  title="Data & Insights"
                >
                  <BarChart3 className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
