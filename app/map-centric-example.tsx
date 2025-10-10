/**
 * Map-Centric Interface Example
 * Demonstrates the new map-first architecture with floating panels
 */

'use client'

import { useState, useEffect } from 'react'
import { MapPin, Users, DollarSign, Calendar, MessageSquare, Plus } from 'lucide-react'
import MapCentricLayout, { CommunityMapLayout, DevelopmentMapLayout } from '@/components/layout/MapCentricLayout'
import { usePanelStore } from '@/store/panels'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock Map Component (replace with actual map implementation)
function InteractiveMap() {
  const [pins, setPins] = useState([
    { id: 1, lat: 53.5500, lng: -2.4833, title: 'Community Garden', type: 'community', description: 'Local community garden project' },
    { id: 2, lat: 53.5510, lng: -2.4823, title: 'Youth Center', type: 'community', description: 'Youth activities and programs' },
    { id: 3, lat: 53.5490, lng: -2.4843, title: 'Local Market', type: 'economy', description: 'Weekly farmers market' },
    { id: 4, lat: 53.5520, lng: -2.4813, title: 'Park Cleanup', type: 'environment', description: 'Monthly park cleanup event' }
  ])
  
  const { openPanel } = usePanelStore()
  
  const handlePinClick = (pin: typeof pins[0]) => {
    // Open relevant panel based on pin type
    switch (pin.type) {
      case 'community':
        openPanel('community')
        break
      case 'economy':
        openPanel('economy')
        break
      case 'environment':
        openPanel('environment')
        break
      default:
        openPanel('community')
    }
  }
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 relative overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 bg-green-50 opacity-50">
        <div className="w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%23059669%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
      </div>
      
      {/* Map Center Indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-4 h-4 bg-silas-green rounded-full border-2 border-white shadow-lg animate-pulse"></div>
      </div>
      
      {/* Mock Map Pins */}
      {pins.map((pin, index) => {
        const offsetX = (index % 2 === 0 ? 1 : -1) * (50 + index * 30)
        const offsetY = (index % 3 === 0 ? 1 : -1) * (30 + index * 20)
        
        return (
          <div
            key={pin.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
            style={{
              left: `calc(50% + ${offsetX}px)`,
              top: `calc(50% + ${offsetY}px)`
            }}
            onClick={() => handlePinClick(pin)}
          >
            <div className="relative">
              <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-200 group-hover:scale-125 ${
                pin.type === 'community' ? 'bg-silas-green' :
                pin.type === 'economy' ? 'bg-blue-500' :
                pin.type === 'environment' ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                <MapPin className="w-4 h-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              
              {/* Pin Tooltip */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md rounded-lg border border-gray-200/60 shadow-xl p-3 min-w-[200px]">
                  <h4 className="font-semibold text-gray-900 mb-1">{pin.title}</h4>
                  <p className="text-sm text-gray-600 mb-2">{pin.description}</p>
                  <Badge variant="outline" className="text-xs">
                    {pin.type}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Map Info Overlay */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="bg-white/90 backdrop-blur-md border-gray-200/60">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Stoneclough Community Map</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>Community Pins:</span>
                <Badge variant="secondary" className="">{pins.filter(p => p.type === 'community').length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Pins:</span>
                <Badge variant="secondary" className="">{pins.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Interactive Instructions */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
        <Card className="bg-white/90 backdrop-blur-md border-gray-200/60">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Click on pins to open relevant panels, or use the floating header to access all features
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                className=""
                onClick={() => usePanelStore.getState().openPanel('community')}
              >
                <Users className="h-4 w-4 mr-1" />
                Community
              </Button>
              <Button
                size="sm"
                variant="outline"
                className=""
                onClick={() => usePanelStore.getState().openPanel('fund')}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Fund
              </Button>
              <Button
                size="sm"
                variant="outline"
                className=""
                onClick={() => usePanelStore.getState().openPanel('chat')}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Example: Basic Map-Centric Interface
export function BasicMapCentricExample() {
  const handleAddPin = () => {
    console.log('Add pin clicked - would open add pin modal/panel')
  }
  
  return (
    <CommunityMapLayout onAddPin={handleAddPin}>
      <InteractiveMap />
    </CommunityMapLayout>
  )
}

// Example: Development Mode with Debug Info
export function DevelopmentMapExample() {
  return (
    <DevelopmentMapLayout>
      <InteractiveMap />
    </DevelopmentMapLayout>
  )
}

// Example: Custom Map-Centric Interface
export function CustomMapCentricExample() {
  const [showWelcome, setShowWelcome] = useState(true)
  
  useEffect(() => {
    // Auto-open community panel after 2 seconds as demo
    const timer = setTimeout(() => {
      usePanelStore.getState().openPanel('community')
      setShowWelcome(false)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <MapCentricLayout
      showFloatingHeader={true}
      showFloatingWidgets={true}
      onAddPin={() => console.log('Custom add pin handler')}
    >
      <InteractiveMap />
      
      {/* Welcome Overlay */}
      {showWelcome && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-silas-green rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SILAS</h2>
              <p className="text-gray-600 mb-4">
                Experience our new map-centric interface where all features are accessible through floating panels.
              </p>
              <Button variant="default" size="default" onClick={() => setShowWelcome(false)} className="w-full">
                Explore the Map
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </MapCentricLayout>
  )
}

// Example: Route-based Panel Opening
export function RouteBasedMapExample() {
  // This would be used in actual pages to automatically open relevant panels
  // based on the current route
  
  return (
    <MapCentricLayout>
      <InteractiveMap />
    </MapCentricLayout>
  )
}

// Main Example Component
export default function MapCentricExamples() {
  const [currentExample, setCurrentExample] = useState<'basic' | 'development' | 'custom' | 'route'>('basic')
  
  const examples = {
    basic: <BasicMapCentricExample />,
    development: <DevelopmentMapExample />,
    custom: <CustomMapCentricExample />,
    route: <RouteBasedMapExample />
  }
  
  return (
    <div className="h-screen relative">
      {/* Example Selector */}
      <div className="absolute top-4 left-4 z-[10000]">
        <Card className="bg-white/95 backdrop-blur-md">
          <CardContent className="p-3">
            <h4 className="font-semibold mb-2 text-sm">Map-Centric Examples</h4>
            <div className="space-y-1">
              {Object.keys(examples).map((key) => (
                <Button
                  key={key}
                  variant={currentExample === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentExample(key as any)}
                  className="w-full justify-start text-xs"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Current Example */}
      {examples[currentExample]}
    </div>
  )
}
