/**
 * Floating Panel Component
 * Resizable, movable, minimizable overlay panel for map-centric interface
 */

'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Move,
  RotateCcw,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { usePanelStore, usePanelActions, PanelConfig, PanelPosition } from '@/store/panels'

interface FloatingPanelProps {
  id: string
  children: ReactNode
  className?: string
}

export default function FloatingPanel({ id, children, className = "" }: FloatingPanelProps) {
  const panel = usePanelStore(state => state.panels[id])
  const activePanel = usePanelStore(state => state.activePanel)
  const { 
    closePanel, 
    minimizePanel, 
    maximizePanel, 
    restorePanel, 
    bringToFront, 
    updatePanelPosition 
  } = usePanelActions()
  
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  
  if (!panel || panel.state === 'closed') return null
  
  const isActive = activePanel === id
  const isMaximized = panel.state === 'maximized'
  const isMinimized = panel.state === 'minimized'
  
  // Handle panel focus
  const handleFocus = () => {
    if (!isActive) {
      bringToFront(id)
    }
  }
  
  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (!panel.isMovable || isMaximized) return
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX - panel.position.x,
      y: e.clientY - panel.position.y
    })
    
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    
    e.preventDefault()
  }
  
  const handleDragMove = (e: MouseEvent) => {
    if (!isDragging || !panel.isMovable) return
    
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Constrain to viewport
    const maxX = window.innerWidth - panel.position.width
    const maxY = window.innerHeight - panel.position.height
    
    updatePanelPosition(id, {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(80, Math.min(newY, maxY)) // Account for header
    })
  }
  
  const handleDragEnd = () => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
  }
  
  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    if (!panel.isResizable || isMaximized) return
    
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: panel.position.width,
      height: panel.position.height
    })
    
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing || !panel.isResizable) return
      
      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y
      
      let newWidth = resizeStart.width
      let newHeight = resizeStart.height
      let newX = panel.position.x
      let newY = panel.position.y
      
      if (direction.includes('right')) {
        newWidth = Math.max(panel.minWidth, resizeStart.width + deltaX)
        if (panel.maxWidth) newWidth = Math.min(panel.maxWidth, newWidth)
      }
      
      if (direction.includes('bottom')) {
        newHeight = Math.max(panel.minHeight, resizeStart.height + deltaY)
        if (panel.maxHeight) newHeight = Math.min(panel.maxHeight, newHeight)
      }
      
      if (direction.includes('left')) {
        const minWidth = panel.minWidth
        const maxWidth = panel.maxWidth || window.innerWidth
        newWidth = Math.max(minWidth, Math.min(maxWidth, resizeStart.width - deltaX))
        newX = panel.position.x + (resizeStart.width - newWidth)
      }
      
      if (direction.includes('top')) {
        const minHeight = panel.minHeight
        const maxHeight = panel.maxHeight || window.innerHeight
        newHeight = Math.max(minHeight, Math.min(maxHeight, resizeStart.height - deltaY))
        newY = panel.position.y + (resizeStart.height - newHeight)
      }
      
      updatePanelPosition(id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      })
    }
    
    const handleResizeEnd = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
    }
    
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
    
    e.preventDefault()
    e.stopPropagation()
  }
  
  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])
  
  if (isMinimized) return null
  
  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: panel.position.x,
        y: panel.position.y
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        position: 'fixed',
        width: panel.position.width,
        height: panel.position.height,
        zIndex: panel.zIndex
      }}
      className={cn(
        "select-none",
        isDragging && "cursor-move",
        isResizing && "cursor-nw-resize",
        className
      )}
      onMouseDown={handleFocus}
    >
      <Card className={cn(
        "h-full flex flex-col overflow-hidden shadow-2xl border-2 transition-all duration-200",
        isActive ? "border-silas-green/50 shadow-silas-green/20" : "border-gray-200/60",
        panel.isModal && "bg-white/98 backdrop-blur-md"
      )}>
        {/* Panel Header */}
        <div
          ref={headerRef}
          className={cn(
            "flex items-center justify-between p-3 border-b border-gray-200/60 bg-gray-50/80 cursor-move",
            !panel.isMovable && "cursor-default"
          )}
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isActive ? "bg-silas-green" : "bg-gray-400"
              )} />
              <h3 className="font-semibold text-gray-900 truncate">
                {panel.title}
              </h3>
            </div>
          </div>
          
          {/* Panel Controls */}
          <div className="flex items-center gap-1">
            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="" align="end">
                <DropdownMenuItem className="" inset={false} onClick={() => restorePanel(id)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Position
                </DropdownMenuItem>
                <DropdownMenuItem className="" inset={false} onClick={() => bringToFront(id)}>
                  <Move className="h-4 w-4 mr-2" />
                  Bring to Front
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Minimize */}
            {panel.isMinimizable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => minimizePanel(id)}
                className="h-6 w-6 p-0 hover:bg-yellow-100"
                title="Minimize"
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
            
            {/* Maximize/Restore */}
            {panel.isMaximizable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => isMaximized ? restorePanel(id) : maximizePanel(id)}
                className="h-6 w-6 p-0 hover:bg-green-100"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            )}
            
            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => closePanel(id)}
              className="h-6 w-6 p-0 hover:bg-red-100"
              title="Close"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Panel Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        
        {/* Resize Handles */}
        {panel.isResizable && !isMaximized && (
          <>
            {/* Corner handles */}
            <div
              className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'top-left')}
            />
            <div
              className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
              onMouseDown={(e) => handleResizeStart(e, 'top-right')}
            />
            <div
              className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
              onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
            />
            <div
              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize bg-gray-300/50 hover:bg-gray-400/50 transition-colors"
              onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
            />
            
            {/* Edge handles */}
            <div
              className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
              onMouseDown={(e) => handleResizeStart(e, 'top')}
            />
            <div
              className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
              onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            />
            <div
              className="absolute left-0 top-3 bottom-3 w-1 cursor-w-resize"
              onMouseDown={(e) => handleResizeStart(e, 'left')}
            />
            <div
              className="absolute right-0 top-3 bottom-3 w-1 cursor-e-resize"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            />
          </>
        )}
      </Card>
    </motion.div>
  )
}
