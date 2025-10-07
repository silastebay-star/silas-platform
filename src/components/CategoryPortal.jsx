import React, { useState, useEffect } from 'react';
import { X, Search, Filter, SortAsc, Plus, MapPin, Users, MessageCircle, ThumbsUp, Share2 } from 'lucide-react';
import { SILAS_BRANDING, getCategoryColor, getCategoryGradient } from '../styles/silasBranding.js';
import { SILAS_CATEGORY_FRAMEWORK } from '../config/categoryFramework.js';
import CategorySocialFeatures from './CategorySocialFeatures.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CategoryPortal = ({ 
  category, 
  isOpen, 
  onClose, 
  pins = [], 
  onPinClick, 
  onPinInteraction,
  LAYER_CONFIG 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedPin, setSelectedPin] = useState(null);

  // Filter and sort pins
  const filteredPins = pins
    .filter(pin => {
      if (!pin || pin.layer !== category) return false;
      const matchesSearch = pin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pin.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' || 
                           (filterBy === 'priority' && pin.metadata?.priority === 'high') ||
                           (filterBy === 'recent' && new Date(pin.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'popular':
          return (b.reactions?.total || 0) - (a.reactions?.total || 0);
        case 'alphabetical':
          return a.name?.localeCompare(b.name) || 0;
        default:
          return 0;
      }
    });

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handlePinClick = (pin) => {
    setSelectedPin(pin);
    onPinClick && onPinClick(pin);
  };

  const handlePinInteraction = (pinId, action) => {
    onPinInteraction && onPinInteraction(pinId, action);
  };

  if (!isOpen || !category || category === 'All') return null;

  const categoryData = SILAS_CATEGORY_FRAMEWORK[category];
  const categoryColor = getCategoryColor(category);
  const categoryGradient = getCategoryGradient(category);
  const IconComponent = categoryData?.icon || LAYER_CONFIG[category]?.icon || MapPin;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
        onClick={onClose}
      />

      {/* Portal Panel */}
      <div 
        className="relative w-full max-w-6xl mx-auto my-8 transition-all duration-300 transform"
        style={{
          background: SILAS_BRANDING.components.panel.background,
          backdropFilter: SILAS_BRANDING.components.panel.backdrop,
          border: `2px solid ${categoryColor}40`,
          boxShadow: `0 25px 50px -12px ${categoryColor}25`,
          borderRadius: SILAS_BRANDING.components.panel.borderRadius
        }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b"
          style={{
            background: categoryGradient,
            borderTopLeftRadius: SILAS_BRANDING.components.panel.borderRadius,
            borderTopRightRadius: SILAS_BRANDING.components.panel.borderRadius,
            borderColor: `${categoryColor}30`
          }}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.2)' }}
              >
                <IconComponent className="h-8 w-8" />
              </div>
              <div>
                <h1
                  className="text-3xl font-bold mb-2"
                  style={{ fontFamily: SILAS_BRANDING.typography.fontFamily.heading }}
                >
                  {categoryData?.name || category} Portal
                </h1>
                <p className="text-white/90 mb-1">
                  {categoryData?.description || `Community hub for ${category.toLowerCase()} activities`}
                </p>
                <p className="text-white/70 text-sm">
                  {filteredPins.length} pins • {categoryData?.tone || 'Community-focused'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder={`Search ${category.toLowerCase()} pins...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/60 focus:bg-white/30"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/20 border-white/30 text-white focus:bg-white/30"
              >
                <option value="recent">Recent</option>
                <option value="popular">Popular</option>
                <option value="alphabetical">A-Z</option>
              </select>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white/20 border-white/30 text-white focus:bg-white/30"
              >
                <option value="all">All Pins</option>
                <option value="priority">High Priority</option>
                <option value="recent">Recent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {/* Category Social Features */}
          <div className="p-6 border-b" style={{ borderColor: `${categoryColor}20` }}>
            <CategorySocialFeatures
              category={category}
              pin={selectedPin}
              onFeatureAction={(action, data) => {
                console.log('Category feature action:', action, data);
                // Handle category-specific actions
              }}
              userRole="member"
            />
          </div>

          {filteredPins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <IconComponent 
                className="h-16 w-16 mb-4"
                style={{ color: `${categoryColor}60` }}
              />
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: SILAS_BRANDING.colors.gray[700] }}
              >
                No {category.toLowerCase()} pins found
              </h3>
              <p 
                className="text-sm mb-4"
                style={{ color: SILAS_BRANDING.colors.gray[500] }}
              >
                {searchTerm ? 'Try adjusting your search terms' : `Be the first to create a ${category.toLowerCase()} pin`}
              </p>
              <Button
                className="flex items-center space-x-2"
                style={{
                  background: categoryGradient,
                  border: 'none'
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Create Pin</span>
              </Button>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPins.map((pin) => (
                  <div
                    key={pin.id}
                    onClick={() => handlePinClick(pin)}
                    className="group cursor-pointer transition-all duration-300 hover:scale-105"
                    style={{
                      background: SILAS_BRANDING.components.card.background,
                      border: SILAS_BRANDING.components.card.border,
                      borderRadius: SILAS_BRANDING.components.card.borderRadius,
                      boxShadow: SILAS_BRANDING.components.card.shadow
                    }}
                  >
                    {/* Pin Header */}
                    <div 
                      className="p-4 border-b"
                      style={{ borderColor: SILAS_BRANDING.colors.gray[200] }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ background: categoryColor }}
                          />
                          <h3 
                            className="font-semibold text-lg group-hover:text-blue-600 transition-colors"
                            style={{ 
                              color: SILAS_BRANDING.colors.gray[900],
                              fontFamily: SILAS_BRANDING.typography.fontFamily.heading
                            }}
                          >
                            {pin.name}
                          </h3>
                        </div>
                        {pin.metadata?.priority === 'high' && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              background: SILAS_BRANDING.colors.warning + '20',
                              color: SILAS_BRANDING.colors.warning
                            }}
                          >
                            High Priority
                          </span>
                        )}
                      </div>

                      <p 
                        className="text-sm line-clamp-3 mb-3"
                        style={{ color: SILAS_BRANDING.colors.gray[600] }}
                      >
                        {pin.description}
                      </p>

                      <div 
                        className="flex items-center space-x-3 text-xs"
                        style={{ color: SILAS_BRANDING.colors.gray[500] }}
                      >
                        <span>{pin.created_by || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(pin.created_at)}</span>
                      </div>
                    </div>

                    {/* Pin Photos */}
                    {pin.metadata?.photos && pin.metadata.photos.length > 0 && (
                      <div className="p-4 border-b" style={{ borderColor: SILAS_BRANDING.colors.gray[200] }}>
                        <div className="flex space-x-2 overflow-x-auto">
                          {pin.metadata.photos.slice(0, 3).map((photo, index) => (
                            <div key={index} className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                              <img 
                                src={photo.url} 
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {pin.metadata.photos.length > 3 && (
                            <div 
                              className="flex-shrink-0 w-20 h-20 rounded-lg flex items-center justify-center text-xs font-medium"
                              style={{ 
                                background: SILAS_BRANDING.colors.gray[100],
                                color: SILAS_BRANDING.colors.gray[600]
                              }}
                            >
                              +{pin.metadata.photos.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Pin Actions */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinInteraction(pin.id, 'like');
                            }}
                            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-xs">{pin.reactions?.like || 0}</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinInteraction(pin.id, 'comment');
                            }}
                            className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">{pin.comments || 0}</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinInteraction(pin.id, 'share');
                            }}
                            className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinClick(pin);
                          }}
                          className="text-xs font-medium hover:underline"
                          style={{ color: categoryColor }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPortal;
