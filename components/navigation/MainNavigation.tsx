/**
 * Main Navigation Component for SILAS Platform
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Users, 
  Calendar, 
  DollarSign, 
  Leaf, 
  Building2, 
  Bot,
  Menu,
  X,
  Settings,
  User
} from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  comingSoon?: boolean
}

const navigationItems: NavigationItem[] = [
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
    description: 'Democratic funding for community projects',
    comingSoon: true
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

export default function MainNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-silas-green rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 font-heading">
              SILAS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              
              return (
                <Link
                  key={item.id}
                  href={item.comingSoon ? '#' : item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active 
                      ? 'bg-silas-green text-white' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                    item.comingSoon && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={(e) => {
                    if (item.comingSoon) {
                      e.preventDefault()
                      // Show coming soon feedback
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.comingSoon && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="">
              <User className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              className=""
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <Link
                    key={item.id}
                    href={item.comingSoon ? '#' : item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors',
                      active 
                        ? 'bg-silas-green text-white' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                      item.comingSoon && 'opacity-60'
                    )}
                    onClick={(e) => {
                      if (item.comingSoon) {
                        e.preventDefault()
                        return
                      }
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{item.label}</span>
                        {item.comingSoon && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile User Menu */}
            <div className="border-t border-gray-200 mt-4 pt-4 space-y-2">
              <Link
                href="/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
