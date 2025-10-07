import React, { useState, useRef, useEffect } from 'react';
import { useDragDrop } from '../contexts/DragDropContext.jsx';
import { 
  Grid3X3, Calendar, Bell, MessageCircle, Settings, Plus, MapPin, Upload,
  Church, Book, Users, ShoppingCart, Briefcase, Tag, Hammer, HandHeart,
  Package, MessageSquare, GraduationCap, BookOpen, Lightbulb, Heart,
  Activity, Leaf, X, Move
} from 'lucide-react';

const iconMap = {
  Grid3X3, Calendar, Bell, MessageCircle, Settings, Plus, MapPin, Upload,
  Church, Book, Users, ShoppingCart, Briefcase, Tag, Hammer, HandHeart,
  Package, MessageSquare, GraduationCap, BookOpen, Lightbulb, Heart,
  Activity, Leaf, X, Move
};

const DraggableFloatingButton = ({ 
  item, 
  onClick, 
  isActive = false,
  className = "",
  style = {},
  children
}) => {
  const { 
    isDragging, 
    draggedItem, 
    isCustomizationMode, 
    startDrag, 
    updateDragPosition, 
    endDrag,
    removeItemFromLayout
  } = useDragDrop();

  const [position, setPosition] = useState(item.position || { x: 0, y: 0 });
  const [isDraggingThis, setIsDraggingThis] = useState(false);
  const buttonRef = useRef(null);
  const dragStartRef = useRef(null);

  // Update position when item position changes
  useEffect(() => {
    if (item.position) {
      setPosition(item.position);
    }
  }, [item.position]);

  // Handle mouse events for dragging
  const handleMouseDown = (e) => {
    if (!isCustomizationMode) {
      onClick && onClick();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    
    setIsDraggingThis(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    
    startDrag(item, e);
    
    // Add global mouse event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingThis || !isCustomizationMode) return;
    
    e.preventDefault();
    updateDragPosition(e);
    
    // Update local position for immediate visual feedback
    const newPosition = {
      x: e.clientX - (draggedItem?.offset?.x || 0),
      y: e.clientY - (draggedItem?.offset?.y || 0)
    };
    setPosition(newPosition);
  };

  const handleMouseUp = (e) => {
    if (!isDraggingThis) return;
    
    setIsDraggingThis(false);
    endDrag(e);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    if (!isCustomizationMode) {
      onClick && onClick();
      return;
    }

    e.preventDefault();
    const touch = e.touches[0];
    setIsDraggingThis(true);
    
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    startDrag(item, mouseEvent);
  };

  const handleTouchMove = (e) => {
    if (!isDraggingThis || !isCustomizationMode) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    updateDragPosition(mouseEvent);
    
    const newPosition = {
      x: touch.clientX - (draggedItem?.offset?.x || 0),
      y: touch.clientY - (draggedItem?.offset?.y || 0)
    };
    setPosition(newPosition);
  };

  const handleTouchEnd = (e) => {
    if (!isDraggingThis) return;
    
    setIsDraggingThis(false);
    const touch = e.changedTouches[0];
    
    const mouseEvent = new MouseEvent('mouseup', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    
    endDrag(mouseEvent);
  };

  // Handle remove button click
  const handleRemove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    removeItemFromLayout(item.id);
  };

  // Get icon component
  const IconComponent = iconMap[item.icon] || MapPin;

  // Get button color based on category
  const getCategoryColor = (category) => {
    const colors = {
      core: 'bg-blue-600 hover:bg-blue-700',
      pins: 'bg-green-600 hover:bg-green-700',
      faith: 'bg-purple-600 hover:bg-purple-700',
      commerce: 'bg-emerald-600 hover:bg-emerald-700',
      works: 'bg-orange-600 hover:bg-orange-700',
      circle: 'bg-red-600 hover:bg-red-700',
      mind: 'bg-indigo-600 hover:bg-indigo-700',
      pulse: 'bg-pink-600 hover:bg-pink-700'
    };
    return colors[category] || colors.core;
  };

  const buttonStyle = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: isDraggingThis ? 1000 : 50,
    transform: isDraggingThis ? 'scale(1.1)' : 'scale(1)',
    transition: isDraggingThis ? 'none' : 'transform 0.2s ease',
    ...style
  };

  return (
    <div
      ref={buttonRef}
      className={`group relative ${className}`}
      style={buttonStyle}
    >
      {/* Main Button */}
      <button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`
          w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all
          ${isActive ? 'ring-4 ring-white ring-opacity-50' : ''}
          ${getCategoryColor(item.category)}
          ${isCustomizationMode ? 'cursor-move' : 'cursor-pointer'}
          ${isDraggingThis ? 'shadow-2xl' : ''}
        `}
        title={item.name}
      >
        {children || <IconComponent className="h-6 w-6" />}
      </button>

      {/* Customization Mode Overlay */}
      {isCustomizationMode && (
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/50 pointer-events-none">
          {/* Move indicator */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <Move className="h-3 w-3 text-white" />
          </div>
        </div>
      )}

      {/* Remove Button (Customization Mode) */}
      {isCustomizationMode && (
        <button
          onClick={handleRemove}
          className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100"
          title="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Tooltip */}
      {!isCustomizationMode && (
        <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {item.name}
          </div>
        </div>
      )}

      {/* Drag Preview */}
      {isDraggingThis && (
        <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse pointer-events-none" />
      )}
    </div>
  );
};

export default DraggableFloatingButton;
