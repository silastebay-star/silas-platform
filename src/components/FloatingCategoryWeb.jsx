import React, { useState, useEffect } from 'react';
import { Plus, X, Edit3, Palette, Grid3X3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FloatingCategoryWeb = ({ 
  isOpen, 
  onClose, 
  categories = [], 
  activeCategory, 
  onCategorySelect, 
  onCategoryAdd,
  onCategoryEdit,
  position = { x: 100, y: 100 }
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#6B7280',
    iconName: 'MapPin'
  });
  const [editingCategory, setEditingCategory] = useState(null);

  // Default categories with enhanced data
  const defaultCategories = [
    { id: 'faith', name: 'faith', displayName: 'Faith', color: '#8B5CF6', iconName: 'Church', description: 'Religious and spiritual activities' },
    { id: 'commerce', name: 'commerce', displayName: 'Commerce', color: '#10B981', iconName: 'Briefcase', description: 'Local businesses and trade' },
    { id: 'works', name: 'works', displayName: 'Works', color: '#F59E0B', iconName: 'Hammer', description: 'Community projects and infrastructure' },
    { id: 'circle', name: 'circle', displayName: 'Circle', color: '#EF4444', iconName: 'Users', description: 'Social gatherings and events' },
    { id: 'mind', name: 'mind', displayName: 'Mind', color: '#3B82F6', iconName: 'Lightbulb', description: 'Education and learning' },
    { id: 'pulse', name: 'pulse', displayName: 'Pulse', color: '#EC4899', iconName: 'TrendingUp', description: 'Health and wellness' }
  ];

  const allCategories = [...defaultCategories, ...categories];

  // Calculate web positions for categories
  const calculateWebPositions = () => {
    const centerX = 0;
    const centerY = 0;
    const radius = 120;
    const angleStep = (2 * Math.PI) / allCategories.length;

    return allCategories.map((category, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start from top
      return {
        ...category,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        angle: angle
      };
    });
  };

  const webPositions = calculateWebPositions();

  const handleAddCategory = () => {
    if (newCategory.name && newCategory.displayName) {
      onCategoryAdd({
        ...newCategory,
        id: `custom_${Date.now()}`,
        name: newCategory.name.toLowerCase().replace(/\s+/g, '_')
      });
      setNewCategory({
        name: '',
        displayName: '',
        description: '',
        color: '#6B7280',
        iconName: 'MapPin'
      });
      setShowAddForm(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      displayName: category.displayName,
      description: category.description || '',
      color: category.color,
      iconName: category.iconName
    });
    setShowAddForm(true);
  };

  const handleSaveEdit = () => {
    if (editingCategory && onCategoryEdit) {
      onCategoryEdit(editingCategory.id, newCategory);
    }
    setEditingCategory(null);
    setShowAddForm(false);
    setNewCategory({
      name: '',
      displayName: '',
      description: '',
      color: '#6B7280',
      iconName: 'MapPin'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Floating Category Web */}
      <div 
        className="fixed z-50 transition-all duration-300"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Central Hub */}
        <div className="relative">
          {/* Category Web */}
          {isExpanded && (
            <div className="absolute inset-0">
              {/* Connection Lines */}
              <svg 
                className="absolute inset-0 pointer-events-none"
                style={{ width: '300px', height: '300px', left: '-150px', top: '-150px' }}
              >
                {webPositions.map((category, index) => (
                  <line
                    key={`line-${index}`}
                    x1="150"
                    y1="150"
                    x2={150 + category.x}
                    y2={150 + category.y}
                    stroke={category.color}
                    strokeWidth="2"
                    opacity="0.3"
                    className="animate-in fade-in duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  />
                ))}
              </svg>

              {/* Category Nodes */}
              {webPositions.map((category, index) => (
                <div
                  key={category.id}
                  className="absolute animate-in zoom-in duration-500 cursor-pointer group"
                  style={{
                    left: category.x - 25,
                    top: category.y - 25,
                    animationDelay: `${index * 100}ms`
                  }}
                  onClick={() => {
                    onCategorySelect(category.name);
                    setIsExpanded(false);
                  }}
                >
                  {/* Category Button */}
                  <div 
                    className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all group-hover:scale-110 ${
                      activeCategory === category.name ? 'ring-4 ring-white ring-opacity-50' : ''
                    }`}
                    style={{ backgroundColor: category.color }}
                  >
                    <span className="text-xs font-bold">
                      {category.displayName.charAt(0)}
                    </span>
                  </div>

                  {/* Category Label */}
                  <div className="absolute top-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {category.displayName}
                    </div>
                  </div>

                  {/* Edit Button for Custom Categories */}
                  {category.id.startsWith('custom_') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
                      }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit3 className="h-3 w-3 text-white" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Category Button */}
              <div
                className="absolute animate-in zoom-in duration-500 cursor-pointer"
                style={{
                  left: -25,
                  top: -80,
                  animationDelay: `${webPositions.length * 100}ms`
                }}
                onClick={() => setShowAddForm(true)}
              >
                <div className="w-12 h-12 rounded-full bg-green-500 shadow-lg flex items-center justify-center text-white hover:scale-110 transition-all">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="absolute top-14 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    Add Category
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Central Button */}
          <div className="relative z-10">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 ${
                isExpanded ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isExpanded ? (
                <X className="h-8 w-8" />
              ) : (
                <Grid3X3 className="h-8 w-8" />
              )}
            </button>

            {/* Central Label */}
            {!isExpanded && (
              <div className="absolute top-18 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Categories
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <Input
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., environment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Display Name</label>
                <Input
                  value={newCategory.displayName}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="e.g., Environment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300"
                  />
                  <Input
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="#6B7280"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingCategory(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingCategory ? handleSaveEdit : handleAddCategory}
                  className="flex-1"
                  disabled={!newCategory.name || !newCategory.displayName}
                >
                  {editingCategory ? 'Save Changes' : 'Add Category'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCategoryWeb;
