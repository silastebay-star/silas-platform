/**
 * Advanced Navigation Features
 * Breadcrumbs, page transitions, keyboard shortcuts, and navigation history
 */

'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  ChevronRight, 
  Home, 
  ArrowLeft, 
  ArrowRight, 
  Command,
  Search,
  Plus,
  Settings,
  Keyboard,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useNavigationStore, useNavigationHistory, useModalState } from '@/store/navigation'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  className?: string
  showHome?: boolean
}

export function Breadcrumbs({ 
  items: customItems, 
  className = "",
  showHome = true 
}: BreadcrumbsProps) {
  const pathname = usePathname()
  
  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    
    if (showHome) {
      breadcrumbs.push({ label: 'Home', href: '/', icon: Home })
    }
    
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      breadcrumbs.push({ label, href: currentPath })
    })
    
    return breadcrumbs
  }
  
  const items = customItems || generateBreadcrumbs()
  
  if (items.length <= 1) return null
  
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      {items.map((item, index) => (
        <motion.div
          key={item.href}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center space-x-2"
        >
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          
          {index === items.length - 1 ? (
            <div className="flex items-center space-x-1 text-gray-900 font-medium">
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </div>
          ) : (
            <Link
              href={item.href}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              <span>{item.label}</span>
            </Link>
          )}
        </motion.div>
      ))}
    </nav>
  )
}

interface NavigationHistoryProps {
  className?: string
}

export function NavigationHistory({ className = "" }: NavigationHistoryProps) {
  const router = useRouter()
  const { history, currentIndex, canGoBack, canGoForward, goBack, goForward } = useNavigationHistory()
  
  const handleGoBack = () => {
    goBack()
  }
  
  const handleGoForward = () => {
    goForward()
  }
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGoBack}
        disabled={!canGoBack}
        className="h-8 w-8 p-0"
        title="Go back"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGoForward}
        disabled={!canGoForward}
        className="h-8 w-8 p-0"
        title="Go forward"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
      
      {history.length > 0 && (
        <Badge variant="outline" className="text-xs px-2 py-1">
          {currentIndex + 1} / {history.length}
        </Badge>
      )}
    </div>
  )
}

interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  category: string
  modifiers?: string[]
}

export function KeyboardShortcuts() {
  const router = useRouter()
  const { modals, open: openModal, close: closeModal } = useModalState()
  const [showShortcuts, setShowShortcuts] = useState(false)
  
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      description: 'Open search',
      action: () => openModal('search'),
      category: 'Navigation',
      modifiers: ['cmd', 'ctrl']
    },
    {
      key: 'a',
      description: 'Add new pin',
      action: () => openModal('addPin'),
      category: 'Actions'
    },
    {
      key: 'h',
      description: 'Go to home',
      action: () => router.push('/'),
      category: 'Navigation'
    },
    {
      key: 'm',
      description: 'Go to map',
      action: () => router.push('/map'),
      category: 'Navigation'
    },
    {
      key: 'f',
      description: 'Go to fund',
      action: () => router.push('/fund'),
      category: 'Navigation'
    },
    {
      key: 's',
      description: 'Open settings',
      action: () => openModal('settings'),
      category: 'Actions',
      modifiers: ['cmd', 'ctrl']
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcuts(true),
      category: 'Help'
    },
    {
      key: 'Escape',
      description: 'Close modals/clear filters',
      action: () => closeModal('search'),
      category: 'Navigation'
    }
  ]
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }
      
      const shortcut = shortcuts.find(s => {
        const keyMatch = s.key.toLowerCase() === e.key.toLowerCase()
        const modifierMatch = s.modifiers ? 
          s.modifiers.some(mod => 
            (mod === 'cmd' && e.metaKey) || 
            (mod === 'ctrl' && e.ctrlKey) ||
            (mod === 'alt' && e.altKey) ||
            (mod === 'shift' && e.shiftKey)
          ) : 
          !e.metaKey && !e.ctrlKey && !e.altKey
        
        return keyMatch && modifierMatch
      })
      
      if (shortcut) {
        e.preventDefault()
        shortcut.action()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
  
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)
  
  return (
    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="">
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.modifiers?.map((modifier, i) => (
                        <kbd key={i} className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
                          {modifier === 'cmd' ? '⌘' : modifier === 'ctrl' ? 'Ctrl' : modifier}
                        </kbd>
                      ))}
                      <kbd className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
                        {shortcut.key === ' ' ? 'Space' : shortcut.key}
                      </kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className = "" }: PageTransitionProps) {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { searchState, setSearchQuery } = useNavigationStore()
  const { open: openModal } = useModalState()
  
  const commands = [
    {
      id: 'home',
      label: 'Go to Home',
      action: () => router.push('/'),
      icon: Home,
      category: 'Navigation'
    },
    {
      id: 'map',
      label: 'Go to Community Map',
      action: () => router.push('/map'),
      icon: Home,
      category: 'Navigation'
    },
    {
      id: 'fund',
      label: 'Go to Community Fund',
      action: () => router.push('/fund'),
      icon: Home,
      category: 'Navigation'
    },
    {
      id: 'add-pin',
      label: 'Add Community Pin',
      action: () => openModal('addPin'),
      icon: Plus,
      category: 'Actions'
    },
    {
      id: 'search',
      label: 'Search Community',
      action: () => setSearchQuery(query),
      icon: Search,
      category: 'Actions'
    },
    {
      id: 'settings',
      label: 'Open Settings',
      action: () => openModal('settings'),
      icon: Settings,
      category: 'Actions'
    }
  ]
  
  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase())
  )
  
  const handleSelect = (command: typeof commands[0]) => {
    command.action()
    onClose()
    setQuery('')
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-4 w-4 text-gray-400 mr-3" />
          <Input
            type="text"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 focus:ring-0 text-sm"
            autoFocus
          />
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <div className="p-2">
              {filteredCommands.map((command) => {
                const Icon = command.icon
                return (
                  <button
                    key={command.id}
                    onClick={() => handleSelect(command)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Icon className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-sm">{command.label}</div>
                      <div className="text-xs text-gray-500">{command.category}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
