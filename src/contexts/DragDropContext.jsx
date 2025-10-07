import React, { createContext, useContext, useState, useEffect } from 'react';

const DragDropContext = createContext();

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

export const DragDropProvider = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dropZones, setDropZones] = useState([]);
  const [customLayout, setCustomLayout] = useState(null);
  const [isCustomizationMode, setIsCustomizationMode] = useState(false);

  // Load saved layout from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('silas-custom-layout');
    if (savedLayout) {
      try {
        setCustomLayout(JSON.parse(savedLayout));
      } catch (error) {
        console.error('Error loading saved layout:', error);
      }
    }
  }, []);

  // Save layout to localStorage
  const saveLayout = (layout) => {
    setCustomLayout(layout);
    localStorage.setItem('silas-custom-layout', JSON.stringify(layout));
  };

  // Default layout configuration
  const getDefaultLayout = () => ({
    floatingButtons: {
      topLeft: [
        { id: 'categories', type: 'category-web', position: { x: 20, y: 20 } },
        { id: 'calendar', type: 'calendar', position: { x: 20, y: 80 } }
      ],
      topRight: [
        { id: 'notifications', type: 'notifications', position: { x: -80, y: 20 } },
        { id: 'social', type: 'social', position: { x: -80, y: 80 } },
        { id: 'admin', type: 'admin', position: { x: -80, y: 140 } }
      ],
      bottomLeft: [],
      bottomRight: [
        { id: 'quick-pin', type: 'quick-pin', position: { x: -80, y: -140 } },
        { id: 'pin-drop', type: 'pin-drop', position: { x: -80, y: -80 } }
      ]
    },
    panels: {
      social: { position: { x: window.innerWidth - 400, y: 0 }, size: { width: 400, height: '100vh' } },
      calendar: { position: { x: window.innerWidth - 350, y: 100 }, size: { width: 320, height: 500 } },
      categoryWeb: { position: { x: 100, y: 150 }, size: { width: 300, height: 300 } }
    },
    toolbars: [],
    widgets: []
  });

  // Get current layout (custom or default)
  const getCurrentLayout = () => {
    return customLayout || getDefaultLayout();
  };

  // Drag handlers
  const startDrag = (item, event) => {
    setIsDragging(true);
    setDraggedItem({
      ...item,
      startPosition: { x: event.clientX, y: event.clientY },
      offset: {
        x: event.clientX - (item.position?.x || 0),
        y: event.clientY - (item.position?.y || 0)
      }
    });
  };

  const updateDragPosition = (event) => {
    if (!isDragging || !draggedItem) return;

    const newPosition = {
      x: event.clientX - draggedItem.offset.x,
      y: event.clientY - draggedItem.offset.y
    };

    setDraggedItem(prev => ({
      ...prev,
      position: newPosition
    }));
  };

  const endDrag = (event) => {
    if (!isDragging || !draggedItem) return;

    const finalPosition = {
      x: event.clientX - draggedItem.offset.x,
      y: event.clientY - draggedItem.offset.y
    };

    // Update layout with new position
    const currentLayout = getCurrentLayout();
    const updatedLayout = updateItemPosition(currentLayout, draggedItem.id, finalPosition);
    saveLayout(updatedLayout);

    setIsDragging(false);
    setDraggedItem(null);
  };

  // Update item position in layout
  const updateItemPosition = (layout, itemId, newPosition) => {
    const updatedLayout = { ...layout };

    // Check floating buttons
    Object.keys(updatedLayout.floatingButtons).forEach(zone => {
      const items = updatedLayout.floatingButtons[zone];
      const itemIndex = items.findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        updatedLayout.floatingButtons[zone][itemIndex].position = newPosition;
      }
    });

    // Check panels
    if (updatedLayout.panels[itemId]) {
      updatedLayout.panels[itemId].position = newPosition;
    }

    return updatedLayout;
  };

  // Add new item to layout
  const addItemToLayout = (item, zone = 'bottomRight') => {
    const currentLayout = getCurrentLayout();
    const updatedLayout = { ...currentLayout };

    if (!updatedLayout.floatingButtons[zone]) {
      updatedLayout.floatingButtons[zone] = [];
    }

    updatedLayout.floatingButtons[zone].push(item);
    saveLayout(updatedLayout);
  };

  // Remove item from layout
  const removeItemFromLayout = (itemId) => {
    const currentLayout = getCurrentLayout();
    const updatedLayout = { ...currentLayout };

    // Remove from floating buttons
    Object.keys(updatedLayout.floatingButtons).forEach(zone => {
      updatedLayout.floatingButtons[zone] = updatedLayout.floatingButtons[zone].filter(
        item => item.id !== itemId
      );
    });

    // Remove from panels
    delete updatedLayout.panels[itemId];

    saveLayout(updatedLayout);
  };

  // Reset to default layout
  const resetLayout = () => {
    localStorage.removeItem('silas-custom-layout');
    setCustomLayout(null);
  };

  // Toggle customization mode
  const toggleCustomizationMode = () => {
    setIsCustomizationMode(prev => !prev);
  };

  // Get available tools from all categories
  const getAvailableTools = () => {
    return [
      // Core tools
      { id: 'categories', type: 'category-web', name: 'Categories', icon: 'Grid3X3', category: 'core' },
      { id: 'calendar', type: 'calendar', name: 'Calendar', icon: 'Calendar', category: 'core' },
      { id: 'notifications', type: 'notifications', name: 'Notifications', icon: 'Bell', category: 'core' },
      { id: 'social', type: 'social', name: 'Social', icon: 'MessageCircle', category: 'core' },
      { id: 'admin', type: 'admin', name: 'Admin', icon: 'Settings', category: 'core' },
      
      // Pin tools
      { id: 'quick-pin', type: 'quick-pin', name: 'Quick Pin', icon: 'Plus', category: 'pins' },
      { id: 'pin-drop', type: 'pin-drop', name: 'Pin Drop', icon: 'MapPin', category: 'pins' },
      { id: 'bulk-pin', type: 'bulk-pin', name: 'Bulk Pins', icon: 'Upload', category: 'pins' },
      
      // Faith tools
      { id: 'prayer-request', type: 'prayer-request', name: 'Prayer Request', icon: 'Church', category: 'faith' },
      { id: 'scripture', type: 'scripture', name: 'Scripture', icon: 'Book', category: 'faith' },
      { id: 'fellowship', type: 'fellowship', name: 'Fellowship', icon: 'Users', category: 'faith' },
      
      // Commerce tools
      { id: 'marketplace', type: 'marketplace', name: 'Marketplace', icon: 'ShoppingCart', category: 'commerce' },
      { id: 'business-directory', type: 'business-directory', name: 'Businesses', icon: 'Briefcase', category: 'commerce' },
      { id: 'local-deals', type: 'local-deals', name: 'Local Deals', icon: 'Tag', category: 'commerce' },
      
      // Works tools
      { id: 'project-manager', type: 'project-manager', name: 'Projects', icon: 'Hammer', category: 'works' },
      { id: 'volunteer', type: 'volunteer', name: 'Volunteer', icon: 'HandHeart', category: 'works' },
      { id: 'resources', type: 'resources', name: 'Resources', icon: 'Package', category: 'works' },
      
      // Circle tools
      { id: 'events', type: 'events', name: 'Events', icon: 'Calendar', category: 'circle' },
      { id: 'groups', type: 'groups', name: 'Groups', icon: 'Users', category: 'circle' },
      { id: 'discussions', type: 'discussions', name: 'Discussions', icon: 'MessageSquare', category: 'circle' },
      
      // Mind tools
      { id: 'learning', type: 'learning', name: 'Learning', icon: 'GraduationCap', category: 'mind' },
      { id: 'library', type: 'library', name: 'Library', icon: 'BookOpen', category: 'mind' },
      { id: 'workshops', type: 'workshops', name: 'Workshops', icon: 'Lightbulb', category: 'mind' },
      
      // Pulse tools
      { id: 'health-tracker', type: 'health-tracker', name: 'Health', icon: 'Heart', category: 'pulse' },
      { id: 'fitness', type: 'fitness', name: 'Fitness', icon: 'Activity', category: 'pulse' },
      { id: 'wellness', type: 'wellness', name: 'Wellness', icon: 'Leaf', category: 'pulse' }
    ];
  };

  const value = {
    // State
    isDragging,
    draggedItem,
    dropZones,
    customLayout,
    isCustomizationMode,
    
    // Layout management
    getCurrentLayout,
    saveLayout,
    resetLayout,
    getDefaultLayout,
    
    // Drag operations
    startDrag,
    updateDragPosition,
    endDrag,
    
    // Item management
    addItemToLayout,
    removeItemFromLayout,
    updateItemPosition,
    
    // Customization
    toggleCustomizationMode,
    getAvailableTools,
    
    // Drop zones
    setDropZones
  };

  return (
    <DragDropContext.Provider value={value}>
      {children}
    </DragDropContext.Provider>
  );
};

export default DragDropContext;
