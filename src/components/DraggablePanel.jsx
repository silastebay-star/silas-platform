import React, { useState, useRef, useEffect } from 'react';
import { useDragDrop } from '../contexts/DragDropContext.jsx';
import { Move, Minimize2, Maximize2, X, MoreHorizontal } from 'lucide-react';

const DraggablePanel = ({ 
  id,
  title,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 400, height: 300 },
  minSize = { width: 200, height: 150 },
  maxSize = { width: 800, height: 600 },
  resizable = true,
  closable = true,
  minimizable = true,
  className = "",
  onClose,
  onMinimize,
  onMaximize
}) => {
  const { 
    isCustomizationMode, 
    getCurrentLayout, 
    saveLayout,
    removeItemFromLayout
  } = useDragDrop();

  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState(null);

  const panelRef = useRef(null);
  const headerRef = useRef(null);

  // Load saved position and size from layout
  useEffect(() => {
    const layout = getCurrentLayout();
    if (layout.panels && layout.panels[id]) {
      const panelData = layout.panels[id];
      if (panelData.position) setPosition(panelData.position);
      if (panelData.size) setSize(panelData.size);
    }
  }, [id, getCurrentLayout]);

  // Save position and size to layout
  const saveToLayout = (newPosition = position, newSize = size) => {
    const layout = getCurrentLayout();
    if (!layout.panels) layout.panels = {};
    
    layout.panels[id] = {
      position: newPosition,
      size: newSize
    };
    
    saveLayout(layout);
  };

  // Handle drag start
  const handleDragStart = (e) => {
    if (!isCustomizationMode && !headerRef.current?.contains(e.target)) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = panelRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  // Handle drag move
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };

    // Constrain to viewport
    newPosition.x = Math.max(0, Math.min(window.innerWidth - size.width, newPosition.x));
    newPosition.y = Math.max(0, Math.min(window.innerHeight - size.height, newPosition.y));

    setPosition(newPosition);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    saveToLayout();
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  // Handle resize start
  const handleResizeStart = (e, handle) => {
    if (!resizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };

  // Handle resize move
  const handleResizeMove = (e) => {
    if (!isResizing || !resizeHandle) return;

    const rect = panelRef.current.getBoundingClientRect();
    let newSize = { ...size };
    let newPosition = { ...position };

    switch (resizeHandle) {
      case 'se': // Southeast
        newSize.width = Math.max(minSize.width, Math.min(maxSize.width, e.clientX - rect.left));
        newSize.height = Math.max(minSize.height, Math.min(maxSize.height, e.clientY - rect.top));
        break;
      case 'sw': // Southwest
        newSize.width = Math.max(minSize.width, Math.min(maxSize.width, rect.right - e.clientX));
        newSize.height = Math.max(minSize.height, Math.min(maxSize.height, e.clientY - rect.top));
        newPosition.x = rect.right - newSize.width;
        break;
      case 'ne': // Northeast
        newSize.width = Math.max(minSize.width, Math.min(maxSize.width, e.clientX - rect.left));
        newSize.height = Math.max(minSize.height, Math.min(maxSize.height, rect.bottom - e.clientY));
        newPosition.y = rect.bottom - newSize.height;
        break;
      case 'nw': // Northwest
        newSize.width = Math.max(minSize.width, Math.min(maxSize.width, rect.right - e.clientX));
        newSize.height = Math.max(minSize.height, Math.min(maxSize.height, rect.bottom - e.clientY));
        newPosition.x = rect.right - newSize.width;
        newPosition.y = rect.bottom - newSize.height;
        break;
      case 'n': // North
        newSize.height = Math.max(minSize.height, Math.min(maxSize.height, rect.bottom - e.clientY));
        newPosition.y = rect.bottom - newSize.height;
        break;
      case 's': // South
        newSize.height = Math.max(minSize.height, Math.min(maxSize.height, e.clientY - rect.top));
        break;
      case 'e': // East
        newSize.width = Math.max(minSize.width, Math.min(maxSize.width, e.clientX - rect.left));
        break;
      case 'w': // West
        newSize.width = Math.max(minSize.width, Math.min(maxSize.width, rect.right - e.clientX));
        newPosition.x = rect.right - newSize.width;
        break;
    }

    setSize(newSize);
    setPosition(newPosition);
  };

  // Handle resize end
  const handleResizeEnd = () => {
    setIsResizing(false);
    setResizeHandle(null);
    saveToLayout();
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };

  // Handle minimize
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
    onMinimize && onMinimize(!isMinimized);
  };

  // Handle maximize
  const handleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      // Restore previous size and position
    } else {
      setIsMaximized(true);
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    onMaximize && onMaximize(!isMaximized);
  };

  // Handle close
  const handleClose = () => {
    if (isCustomizationMode) {
      removeItemFromLayout(id);
    } else {
      onClose && onClose();
    }
  };

  const panelStyle = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: size.width,
    height: isMinimized ? 'auto' : size.height,
    zIndex: isDragging || isResizing ? 1000 : 40,
    transition: isDragging || isResizing ? 'none' : 'all 0.2s ease'
  };

  return (
    <div
      ref={panelRef}
      className={`bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden ${className}`}
      style={panelStyle}
    >
      {/* Header */}
      <div
        ref={headerRef}
        onMouseDown={handleDragStart}
        className={`
          flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200
          ${isCustomizationMode || isDragging ? 'cursor-move' : 'cursor-default'}
        `}
      >
        <div className="flex items-center space-x-2">
          {isCustomizationMode && (
            <Move className="h-4 w-4 text-gray-400" />
          )}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>

        <div className="flex items-center space-x-1">
          {minimizable && (
            <button
              onClick={handleMinimize}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4 text-gray-600" />
            </button>
          )}
          
          <button
            onClick={handleMaximize}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Maximize"
          >
            <Maximize2 className="h-4 w-4 text-gray-600" />
          </button>

          {closable && (
            <button
              onClick={handleClose}
              className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
              title="Close"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      )}

      {/* Resize Handles */}
      {resizable && !isMinimized && !isMaximized && (
        <>
          {/* Corner handles */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'se')}
            className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
            className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
            className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
            className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize"
          />

          {/* Edge handles */}
          <div
            onMouseDown={(e) => handleResizeStart(e, 'n')}
            className="absolute top-0 left-3 right-3 h-1 cursor-n-resize"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 's')}
            className="absolute bottom-0 left-3 right-3 h-1 cursor-s-resize"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'e')}
            className="absolute top-3 bottom-3 right-0 w-1 cursor-e-resize"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, 'w')}
            className="absolute top-3 bottom-3 left-0 w-1 cursor-w-resize"
          />
        </>
      )}

      {/* Customization Mode Overlay */}
      {isCustomizationMode && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 pointer-events-none bg-blue-50/10" />
      )}
    </div>
  );
};

export default DraggablePanel;
