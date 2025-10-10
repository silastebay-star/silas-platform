/**
 * Unified Layout System
 * Brings together all navigation and layout components for a cohesive experience
 */

'use client'

import { ReactNode, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useNavigationStore, useSidebarState, useModalState } from '@/store/navigation'
import { cn } from '@/lib/utils'

function LoadingIndicator() {
  const isNavigating = useNavigationStore(state => state.isNavigating)

  if (!isNavigating) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-silas-green to-green-600 z-50"
    />
  )
}

// Layout Components
import { PageLayout, PageHeader, PageContent } from './PageLayout'
import EnhancedFloatingSidebar from '../navigation/EnhancedFloatingSidebar'
import UnifiedFloatingNav from '../navigation/UnifiedFloatingNav'
import { FloatingWidgets } from '../ui/FloatingWidgets'
import { 
  Breadcrumbs, 
  NavigationHistory, 
  KeyboardShortcuts, 
  PageTransition,
  CommandPalette 
} from '../navigation/NavigationFeatures'

// Modals
import AddPinModal from '../map/AddPinModal'
import AuthModal from '../auth/AuthModal'

// UI Components
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Toaster } from 'sonner'
import { Settings, Maximize2, Minimize2, Eye, EyeOff } from 'lucide-react'

interface UnifiedLayoutProps {
  children: ReactNode
  showFloatingNav?: boolean
  showSidebar?: boolean
  showFloatingWidgets?: boolean
  showBreadcrumbs?: boolean
  pageTitle?: string
  pageSubtitle?: string
  pageDescription?: string
  pageBadge?: string
  pageActions?: ReactNode
  breadcrumbItems?: Array<{
    label: string
    href: string
    icon?: React.ComponentType<{ className?: string }>
  }>
  className?: string
  contentMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  contentPadding?: 'none' | 'sm' | 'md' | 'lg'
  onAddPin?: () => void
  onOpenChat?: () => void
}

function UnifiedLayoutContent({
  children,
  showFloatingNav = true,
  showSidebar = true,
  showFloatingWidgets = true,
  showBreadcrumbs = true,
  pageTitle,
  pageSubtitle,
  pageDescription,
  pageBadge,
  pageActions,
  breadcrumbItems,
  className = "",
  contentMaxWidth = 'full',
  contentPadding = 'lg',
  onAddPin,
  onOpenChat
}: UnifiedLayoutProps) {
  const pathname = usePathname()
  const { 
    layoutMode, 
    isFullscreen, 
    preferences, 
    toggleFullscreen,
    updatePreferences 
  } = useNavigationStore()
  const { state: sidebarState } = useSidebarState()
  const { modals, open: openModal, close: closeModal } = useModalState()
  
  // Auto-generate page title from pathname if not provided
  const getPageTitle = () => {
    if (pageTitle) return pageTitle
    
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return 'Home'
    
    const lastSegment = segments[segments.length - 1]
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
  }
  
  // Context-aware page actions
  const getContextualActions = () => {
    const baseActions = [
      <Button
        key="fullscreen"
        variant="ghost"
        size="sm"
        onClick={toggleFullscreen}
        className="h-8 w-8 p-0"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </Button>,
      <Button
        key="widgets"
        variant="ghost"
        size="sm"
        onClick={() => updatePreferences({ floatingWidgetsEnabled: !preferences.floatingWidgetsEnabled })}
        className="h-8 w-8 p-0"
        title={preferences.floatingWidgetsEnabled ? 'Hide widgets' : 'Show widgets'}
      >
        {preferences.floatingWidgetsEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>,
      <Button
        key="settings"
        variant="ghost"
        size="sm"
        onClick={() => openModal('settings')}
        className="h-8 w-8 p-0"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>
    ]
    
    return pageActions ? [...baseActions, pageActions] : baseActions
  }
  
  // Handle add pin action
  const handleAddPin = () => {
    if (onAddPin) {
      onAddPin()
    } else {
      openModal('addPin')
    }
  }
  
  if (isFullscreen) {
    return (
      <div className="h-screen overflow-hidden bg-gray-50">
        <PageTransition>
          {children}
        </PageTransition>
        <KeyboardShortcuts />
      </div>
    )
  }
  
  return (
    <div className={cn("min-h-screen bg-gray-50 relative", className)}>
      {/* Floating Navigation */}
      {showFloatingNav && (
        <UnifiedFloatingNav
          onAddPin={handleAddPin}
          showSearch={true}
          showQuickActions={true}
        />
      )}
      
      {/* Enhanced Floating Sidebar */}
      {showSidebar && layoutMode === 'floating' && (
        <EnhancedFloatingSidebar
          onAddPin={handleAddPin}
        />
      )}
      
      {/* Main Content */}
      <PageLayout
        showSidebar={showSidebar && layoutMode === 'sidebar'}
        className="pt-20"
      >
        <PageTransition>
          <PageContent
            maxWidth={contentMaxWidth}
            padding={contentPadding}
          >
            {/* Page Header */}
            {(pageTitle || pageSubtitle || pageDescription || showBreadcrumbs) && (
              <div className="space-y-6 mb-8">
                {/* Breadcrumbs and Navigation History */}
                {showBreadcrumbs && (
                  <div className="flex items-center justify-between">
                    <Breadcrumbs items={breadcrumbItems} />
                    <NavigationHistory />
                  </div>
                )}
                
                {/* Page Header */}
                <PageHeader
                  title={getPageTitle()}
                  subtitle={pageSubtitle}
                  description={pageDescription}
                  badge={pageBadge}
                  actions={<div className="flex items-center gap-2">{getContextualActions()}</div>}
                />
              </div>
            )}
            
            {/* Page Content */}
            {children}
          </PageContent>
        </PageTransition>
      </PageLayout>
      
      {/* Floating Widgets */}
      {showFloatingWidgets && preferences.floatingWidgetsEnabled && (
        <FloatingWidgets
          onAddPin={handleAddPin}
          onOpenChat={onOpenChat}
        />
      )}
      
      {/* Modals */}
      {modals.addPin && (
        <AddPinModal
          isOpen={modals.addPin}
          onClose={() => closeModal('addPin')}
          onSubmit={(pin) => {
            // Handle pin submission
            closeModal('addPin')
          }}
          location={{ lat: 53.5500, lng: -2.4833 }} // Default to Stoneclough
        />
      )}
      
      {modals.auth && (
        <AuthModal
          isOpen={modals.auth}
          onClose={() => closeModal('auth')}
          defaultMode="signin"
        />
      )}
      
      {/* Command Palette */}
      <CommandPalette
        isOpen={modals.search}
        onClose={() => closeModal('search')}
      />
      
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
      
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'white',
            border: '1px solid #e5e7eb',
            color: '#374151',
          },
        }}
      />
      
      {/* Loading Indicator */}
      <LoadingIndicator />
    </div>
  )
}

export default function UnifiedLayout(props: UnifiedLayoutProps) {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-silas-green rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="text-sm text-gray-600">Loading SILAS...</div>
        </div>
      </div>
    }>
      <UnifiedLayoutContent {...props} />
    </Suspense>
  )
}

// Convenience exports for specific layout patterns
export function MapLayout({ children, ...props }: Omit<UnifiedLayoutProps, 'contentMaxWidth' | 'contentPadding'>) {
  return (
    <UnifiedLayout
      {...props}
      contentMaxWidth="full"
      contentPadding="none"
      showBreadcrumbs={false}
    >
      {children}
    </UnifiedLayout>
  )
}

export function DashboardLayout({ children, ...props }: UnifiedLayoutProps) {
  return (
    <UnifiedLayout
      {...props}
      contentMaxWidth="2xl"
      showFloatingWidgets={true}
    >
      {children}
    </UnifiedLayout>
  )
}

export function ContentLayout({ children, ...props }: UnifiedLayoutProps) {
  return (
    <UnifiedLayout
      {...props}
      contentMaxWidth="lg"
      showFloatingWidgets={false}
    >
      {children}
    </UnifiedLayout>
  )
}
