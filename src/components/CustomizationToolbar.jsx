import React, { useState } from 'react';
import { useDragDrop } from '../contexts/DragDropContext.jsx';
import { 
  Settings, Plus, RotateCcw, Save, X, Eye, EyeOff, Grid, 
  Palette, Move, Trash2, Download, Upload, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CustomizationToolbar = () => {
  const {
    isCustomizationMode,
    toggleCustomizationMode,
    getAvailableTools,
    addItemToLayout,
    resetLayout,
    getCurrentLayout,
    saveLayout
  } = useDragDrop();

  const [showToolPalette, setShowToolPalette] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const availableTools = getAvailableTools();

  // Filter tools based on search and category
  const filteredTools = availableTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(availableTools.map(tool => tool.category))];

  // Handle adding tool to layout
  const handleAddTool = (tool) => {
    const newItem = {
      ...tool,
      position: { 
        x: window.innerWidth / 2 - 25, 
        y: window.innerHeight / 2 - 25 
      }
    };
    addItemToLayout(newItem, 'bottomRight');
    setShowToolPalette(false);
  };

  // Export layout
  const exportLayout = () => {
    const layout = getCurrentLayout();
    const dataStr = JSON.stringify(layout, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'silas-layout.json';
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Import layout
  const importLayout = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const layout = JSON.parse(e.target.result);
        saveLayout(layout);
        alert('Layout imported successfully!');
      } catch (error) {
        alert('Error importing layout. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!isCustomizationMode) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <Button
          onClick={toggleCustomizationMode}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Customize Layout
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Main Toolbar */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          {/* Customization Mode Indicator */}
          <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 rounded-lg">
            <Move className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Customization Mode</span>
          </div>

          {/* Add Tools */}
          <Button
            onClick={() => setShowToolPalette(!showToolPalette)}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Tools</span>
          </Button>

          {/* Reset Layout */}
          <Button
            onClick={() => {
              if (confirm('Reset to default layout? This will remove all customizations.')) {
                resetLayout();
              }
            }}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>

          {/* Export Layout */}
          <Button
            onClick={exportLayout}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>

          {/* Import Layout */}
          <label className="cursor-pointer">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              asChild
            >
              <span>
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </span>
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importLayout}
              className="hidden"
            />
          </label>

          {/* Exit Customization */}
          <Button
            onClick={toggleCustomizationMode}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Done
          </Button>
        </div>
      </div>

      {/* Tool Palette */}
      {showToolPalette && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Tools to Layout</h3>
                <button
                  onClick={() => setShowToolPalette(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTools.map(tool => (
                  <div
                    key={tool.id}
                    onClick={() => handleAddTool(tool)}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${getCategoryColor(tool.category)}`}>
                        {/* Tool icon would go here */}
                        <div className="w-6 h-6 bg-white/20 rounded" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-gray-900 text-sm">{tool.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{tool.category}</div>
                      </div>
                    </div>
                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="w-full text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredTools.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">No tools found</div>
                  <div className="text-sm text-gray-500">Try adjusting your search or filter</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Drag tools around the screen to customize your layout
                </div>
                <Button
                  onClick={() => setShowToolPalette(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customization Instructions */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
        🎯 Drag buttons to reposition • Click + to add tools • Click × to remove
      </div>
    </>
  );
};

// Helper function for category colors
const getCategoryColor = (category) => {
  const colors = {
    core: 'bg-blue-600',
    pins: 'bg-green-600',
    faith: 'bg-purple-600',
    commerce: 'bg-emerald-600',
    works: 'bg-orange-600',
    circle: 'bg-red-600',
    mind: 'bg-indigo-600',
    pulse: 'bg-pink-600'
  };
  return colors[category] || colors.core;
};

export default CustomizationToolbar;
