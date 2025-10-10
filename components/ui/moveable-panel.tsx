/**
 * Moveable Panel Component
 * Draggable and resizable panels with user preference persistence
 */

'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import Draggable from 'react-draggable'
import { GripVertical, Maximize2, Minimize2, X, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MoveablePanelProps {
  id: string
  title: string
  children: ReactNode
  defaultPosition?: { x: number; y: number }
  defaultSize?: { width: number; height: number }
  minSize?: { width: number; height: number }
  maxSize?: { width: number; height: number }
  resizable?: boolean
  collapsible?: boolean
  closeable?: boolean
  className?: string
  onClose?: () => void
  onPositionChange?: (position: { x: number; y: number }) => void
  onSizeChange?: (size: { width: number; height: number }) => void
}

interface PanelState {
  position: { x: number; y: number }
  size: { width: number; height: number }
  isCollapsed: boolean
  isMaximized: boolean
}

export default function MoveablePanel({
  id,
  title,
  children,
  defaultPosition = { x: 20, y: 20 },
  defaultSize = { width: 320, height: 400 },
  minSize = { width: 280, height: 200 },
  maxSize = { width: 600, height: 800 },
  resizable = true,
  collapsible = true,
  closeable = false,
  className = "",
  onClose,
  onPositionChange,
  onSizeChange
}: MoveablePanelProps) {
  const [panelState, setPanelState] = useState<PanelState>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`panel-${id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          return {
            position: parsed.position || defaultPosition,
            size: parsed.size || defaultSize,
            isCollapsed: parsed.isCollapsed || false,
            isMaximized: parsed.isMaximized || false
          }
        } catch (e) {
          console.warn('Failed to parse saved panel state:', e)
        }
      }
    }
    
    return {
      position: defaultPosition,
      size: defaultSize,
      isCollapsed: false,
      isMaximized: false
    }
  })

  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  // Save panel state to localStorage
  useEffect(() => {
    localStorage.setItem(`panel-${id}`, JSON.stringify(panelState))
    onPositionChange?.(panelState.position)
    onSizeChange?.(panelState.size)
  }, [panelState, id, onPositionChange, onSizeChange])

  // Handle window resize to keep panels in bounds
  useEffect(() => {
    const handleResize = () => {
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect()
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        
        let newPosition = { ...panelState.position }
        
        // Keep panel in bounds
        if (rect.right > windowWidth) {
          newPosition.x = windowWidth - panelState.size.width - 20
        }
        if (rect.bottom > windowHeight) {
          newPosition.y = windowHeight - panelState.size.height - 20
        }
        if (newPosition.x < 0) newPosition.x = 20
        if (newPosition.y < 0) newPosition.y = 20
        
        if (newPosition.x !== panelState.position.x || newPosition.y !== panelState.position.y) {
          setPanelState(prev => ({ ...prev, position: newPosition }))
        }
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [panelState.position, panelState.size])

  const handleDrag = (e: any, data: any) => {
    setPanelState(prev => ({
      ...prev,
      position: { x: data.x, y: data.y }
    }))
  }

  const handleToggleCollapse = () => {
    setPanelState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed
    }))
  }

  const handleToggleMaximize = () => {
    setPanelState(prev => ({
      ...prev,
      isMaximized: !prev.isMaximized,
      position: prev.isMaximized ? defaultPosition : { x: 20, y: 20 },
      size: prev.isMaximized ? defaultSize : { 
        width: Math.min(window.innerWidth - 40, maxSize.width), 
        height: Math.min(window.innerHeight - 40, maxSize.height) 
      }
    }))
  }

  const handleReset = () => {
    setPanelState({
      position: defaultPosition,
      size: defaultSize,
      isCollapsed: false,
      isMaximized: false
    })
  }

  const currentSize = panelState.isMaximized 
    ? { width: window.innerWidth - 40, height: window.innerHeight - 40 }
    : panelState.size

  const currentPosition = panelState.isMaximized 
    ? { x: 20, y: 20 }
    : panelState.position

  return (
    <Draggable
      handle=".drag-handle"
      position={currentPosition}
      onDrag={handleDrag}
      onStart={() => setIsDragging(true)}
      onStop={() => setIsDragging(false)}
      disabled={panelState.isMaximized}
      bounds="parent"
    >
      <div
        ref={panelRef}
        className={cn(
          "absolute z-[9000] transition-all duration-200",
          isDragging && "cursor-grabbing",
          panelState.isMaximized && "!fixed !inset-5 !transform-none",
          className
        )}
        style={{
          width: currentSize.width,
          height: panelState.isCollapsed ? 'auto' : currentSize.height,
          minWidth: minSize.width,
          minHeight: panelState.isCollapsed ? 'auto' : minSize.height,
          maxWidth: maxSize.width,
          maxHeight: maxSize.height
        }}
      >
        <Card className="h-full bg-white/95 backdrop-blur-md border-gray-200/60 shadow-xl">
          {/* Header */}
          <CardHeader className="pb-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900 truncate">
                  {title}
                </h3>
              </div>
              
              <div className="flex items-center gap-1">
                {collapsible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleCollapse}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    {panelState.isCollapsed ? (
                      <Maximize2 className="h-3 w-3" />
                    ) : (
                      <Minimize2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleMaximize}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                  title="Reset position and size"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                
                {closeable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Content */}
          {!panelState.isCollapsed && (
            <CardContent className="p-0 h-full overflow-hidden">
              <div className="h-full overflow-auto">
                {children}
              </div>
            </CardContent>
          )}

          {/* Resize Handle */}
          {resizable && !panelState.isCollapsed && !panelState.isMaximized && (
            <div
              ref={resizeRef}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400 transition-colors"
              style={{
                background: 'linear-gradient(-45deg, transparent 30%, currentColor 30%, currentColor 40%, transparent 40%, transparent 60%, currentColor 60%, currentColor 70%, transparent 70%)'
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                setIsResizing(true)
                
                const startX = e.clientX
                const startY = e.clientY
                const startWidth = currentSize.width
                const startHeight = currentSize.height
                
                const handleMouseMove = (e: MouseEvent) => {
                  const newWidth = Math.max(minSize.width, Math.min(maxSize.width, startWidth + (e.clientX - startX)))
                  const newHeight = Math.max(minSize.height, Math.min(maxSize.height, startHeight + (e.clientY - startY)))
                  
                  setPanelState(prev => ({
                    ...prev,
                    size: { width: newWidth, height: newHeight }
                  }))
                }
                
                const handleMouseUp = () => {
                  setIsResizing(false)
                  document.removeEventListener('mousemove', handleMouseMove)
                  document.removeEventListener('mouseup', handleMouseUp)
                }
                
                document.addEventListener('mousemove', handleMouseMove)
                document.addEventListener('mouseup', handleMouseUp)
              }}
            />
          )}
        </Card>
      </div>
    </Draggable>
  )
}
