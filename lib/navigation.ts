/**
 * Unified Navigation System for SILAS Platform
 */

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string | number
  description?: string
  category?: string
  requiresAuth?: boolean
  comingSoon?: boolean
}

export interface BreadcrumbItem {
  label: string
  href?: string
}

export class SilasNavigation {
  private static instance: SilasNavigation
  private router: any

  static getInstance(): SilasNavigation {
    if (!SilasNavigation.instance) {
      SilasNavigation.instance = new SilasNavigation()
    }
    return SilasNavigation.instance
  }

  setRouter(router: any) {
    this.router = router
  }

  /**
   * Navigate to a specific route
   */
  navigate(href: string, options?: { replace?: boolean }) {
    if (!this.router) {
      console.warn('Router not initialized')
      return
    }

    if (options?.replace) {
      this.router.replace(href)
    } else {
      this.router.push(href)
    }
  }

  /**
   * Navigate back
   */
  goBack() {
    if (!this.router) {
      console.warn('Router not initialized')
      return
    }
    this.router.back()
  }

  /**
   * Navigate to map with optional pin selection
   */
  goToMap(pinId?: string) {
    const href = pinId ? `/map?pin=${pinId}` : '/map'
    this.navigate(href)
  }

  /**
   * Navigate to pin detail
   */
  goToPin(pinId: string) {
    this.navigate(`/map?pin=${pinId}`)
  }

  /**
   * Navigate to user profile
   */
  goToProfile(userId?: string) {
    const href = userId ? `/profile/${userId}` : '/profile'
    this.navigate(href)
  }

  /**
   * Navigate to community fund
   */
  goToFund(proposalId?: string) {
    const href = proposalId ? `/fund?proposal=${proposalId}` : '/fund'
    this.navigate(href)
  }

  /**
   * Navigate to events
   */
  goToEvents(eventId?: string) {
    const href = eventId ? `/events?event=${eventId}` : '/events'
    this.navigate(href)
  }

  /**
   * Navigate to local economy
   */
  goToEconomy(businessId?: string) {
    const href = businessId ? `/economy?business=${businessId}` : '/economy'
    this.navigate(href)
  }

  /**
   * Navigate to environment dashboard
   */
  goToEnvironment() {
    this.navigate('/environment')
  }

  /**
   * Navigate to AI copilot
   */
  goToAI() {
    this.navigate('/ai')
  }

  /**
   * Navigate to settings
   */
  goToSettings(section?: string) {
    const href = section ? `/settings?section=${section}` : '/settings'
    this.navigate(href)
  }

  /**
   * Navigate to auth pages
   */
  goToSignIn(returnTo?: string) {
    const href = returnTo ? `/auth/signin?returnTo=${encodeURIComponent(returnTo)}` : '/auth/signin'
    this.navigate(href)
  }

  goToSignUp(returnTo?: string) {
    const href = returnTo ? `/auth/signup?returnTo=${encodeURIComponent(returnTo)}` : '/auth/signup'
    this.navigate(href)
  }

  /**
   * External navigation
   */
  openExternal(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /**
   * Share functionality
   */
  sharePin(pinId: string, title?: string) {
    const url = `${window.location.origin}/map?pin=${pinId}`
    
    if (navigator.share) {
      navigator.share({
        title: title || 'Check out this pin on SILAS',
        url,
      })
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url)
      // Show feedback that link was copied
    }
  }

  shareEvent(eventId: string, title?: string) {
    const url = `${window.location.origin}/events?event=${eventId}`
    
    if (navigator.share) {
      navigator.share({
        title: title || 'Check out this event on SILAS',
        url,
      })
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  /**
   * Get current route information
   */
  getCurrentPath(): string {
    return window.location.pathname
  }

  getCurrentParams(): URLSearchParams {
    return new URLSearchParams(window.location.search)
  }

  /**
   * Check if current route matches
   */
  isCurrentRoute(href: string): boolean {
    return this.getCurrentPath() === href
  }

  /**
   * Generate breadcrumbs for current route
   */
  generateBreadcrumbs(): BreadcrumbItem[] {
    const path = this.getCurrentPath()
    const segments = path.split('/').filter(Boolean)
    
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ]

    let currentPath = ''
    for (const segment of segments) {
      currentPath += `/${segment}`
      
      // Map segments to readable labels
      const labelMap: Record<string, string> = {
        map: 'Community Map',
        fund: 'Community Fund',
        events: 'Events',
        economy: 'Local Economy',
        environment: 'Environment',
        ai: 'AI Copilot',
        profile: 'Profile',
        settings: 'Settings',
        auth: 'Authentication'
      }

      breadcrumbs.push({
        label: labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath
      })
    }

    return breadcrumbs
  }
}

// Convenience instance
export const navigation = SilasNavigation.getInstance()

// React hook for navigation
export function useNavigation() {
  const router = useRouter()
  
  // Initialize router in navigation instance
  React.useEffect(() => {
    navigation.setRouter(router)
  }, [router])

  return {
    navigate: useCallback((href: string, options?: { replace?: boolean }) => 
      navigation.navigate(href, options), []),
    goBack: useCallback(() => navigation.goBack(), []),
    goToMap: useCallback((pinId?: string) => navigation.goToMap(pinId), []),
    goToPin: useCallback((pinId: string) => navigation.goToPin(pinId), []),
    goToProfile: useCallback((userId?: string) => navigation.goToProfile(userId), []),
    goToFund: useCallback((proposalId?: string) => navigation.goToFund(proposalId), []),
    goToEvents: useCallback((eventId?: string) => navigation.goToEvents(eventId), []),
    goToEconomy: useCallback((businessId?: string) => navigation.goToEconomy(businessId), []),
    goToEnvironment: useCallback(() => navigation.goToEnvironment(), []),
    goToAI: useCallback(() => navigation.goToAI(), []),
    goToSettings: useCallback((section?: string) => navigation.goToSettings(section), []),
    goToSignIn: useCallback((returnTo?: string) => navigation.goToSignIn(returnTo), []),
    goToSignUp: useCallback((returnTo?: string) => navigation.goToSignUp(returnTo), []),
    openExternal: useCallback((url: string) => navigation.openExternal(url), []),
    sharePin: useCallback((pinId: string, title?: string) => navigation.sharePin(pinId, title), []),
    shareEvent: useCallback((eventId: string, title?: string) => navigation.shareEvent(eventId, title), []),
    getCurrentPath: useCallback(() => navigation.getCurrentPath(), []),
    getCurrentParams: useCallback(() => navigation.getCurrentParams(), []),
    isCurrentRoute: useCallback((href: string) => navigation.isCurrentRoute(href), []),
    generateBreadcrumbs: useCallback(() => navigation.generateBreadcrumbs(), []),
  }
}
