/**
 * Consistent Page Layout System
 * Unified layout components with consistent spacing, typography, and positioning
 */

'use client'

import { ReactNode, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useNavigationStore } from '@/store/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ChevronRight, Home } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
  actions?: ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
    icon?: React.ComponentType<{ className?: string }>
  }>
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  description,
  badge,
  badgeVariant = 'secondary',
  actions,
  breadcrumbs,
  className = ""
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && <ChevronRight className="h-4 w-4" />}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                >
                  {crumb.icon && <crumb.icon className="h-4 w-4" />}
                  <span>{crumb.label}</span>
                </a>
              ) : (
                <div className="flex items-center space-x-1">
                  {crumb.icon && <crumb.icon className="h-4 w-4" />}
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
      
      {/* Header Content */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            {badge && (
              <Badge variant={badgeVariant} className="text-sm">
                {badge}
              </Badge>
            )}
          </div>
          
          {subtitle && (
            <p className="text-xl text-gray-600 font-medium">
              {subtitle}
            </p>
          )}
          
          {description && (
            <p className="text-gray-500 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface PageContentProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function PageContent({
  children,
  className = "",
  maxWidth = 'full',
  padding = 'lg'
}: PageContentProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-none'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        "mx-auto",
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </motion.div>
  )
}

interface PageSectionProps {
  title?: string
  subtitle?: string
  description?: string
  children: ReactNode
  className?: string
  headerActions?: ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
}

export function PageSection({
  title,
  subtitle,
  description,
  children,
  className = "",
  headerActions,
  collapsible = false,
  defaultExpanded = true
}: PageSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-6", className)}
    >
      {(title || subtitle || description || headerActions) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {title && (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                    {title}
                  </h2>
                  {collapsible && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="h-8 w-8 p-0"
                    >
                      <motion.div
                        animate={{ rotate: isExpanded ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    </Button>
                  )}
                </div>
              )}
              
              {subtitle && (
                <p className="text-lg text-gray-600 font-medium">
                  {subtitle}
                </p>
              )}
              
              {description && (
                <p className="text-gray-500">
                  {description}
                </p>
              )}
            </div>
            
            {headerActions && (
              <div className="flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
          
          <Separator className="" />
        </div>
      )}
      
      <AnimatePresence>
        {(!collapsible || isExpanded) && (
          <motion.div
            initial={collapsible ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

interface PageLayoutProps {
  children: ReactNode
  header?: ReactNode
  sidebar?: ReactNode
  footer?: ReactNode
  className?: string
  sidebarWidth?: number
  showSidebar?: boolean
}

export function PageLayout({
  children,
  header,
  sidebar,
  footer,
  className = "",
  sidebarWidth = 320,
  showSidebar = true
}: PageLayoutProps) {
  const { layoutMode, isFullscreen } = useNavigationStore()
  const pathname = usePathname()
  
  // Update page title in navigation store
  useEffect(() => {
    const { setCurrentPath } = useNavigationStore.getState()
    setCurrentPath(pathname)
  }, [pathname])
  
  if (isFullscreen) {
    return (
      <div className="h-screen overflow-hidden">
        {children}
      </div>
    )
  }
  
  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Header */}
      {header && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/60"
        >
          {header}
        </motion.header>
      )}
      
      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        {sidebar && showSidebar && layoutMode === 'sidebar' && (
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ width: sidebarWidth }}
            className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-white border-r border-gray-200/60"
          >
            {sidebar}
          </motion.aside>
        )}
        
        {/* Main Content */}
        <main className="flex-1 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
      
      {/* Footer */}
      {footer && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-t border-gray-200/60"
        >
          {footer}
        </motion.footer>
      )}
    </div>
  )
}

// Utility components for common layouts
export function CenteredLayout({ children, className = "" }: { children: ReactNode, className?: string }) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-gray-50", className)}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
    </div>
  )
}

export function SplitLayout({ 
  left, 
  right, 
  leftWidth = "50%",
  className = "" 
}: { 
  left: ReactNode
  right: ReactNode
  leftWidth?: string
  className?: string 
}) {
  return (
    <div className={cn("h-screen flex", className)}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ width: leftWidth }}
        className="overflow-y-auto"
      >
        {left}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 overflow-y-auto"
      >
        {right}
      </motion.div>
    </div>
  )
}
