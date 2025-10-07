import React, { useState } from 'react';
import { Grid3X3, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SILAS_BRANDING, getCategoryColor, getCategoryGradient } from '../styles/silasBranding.js';
import silasLogo from '../assets/silas-logo.png';

const SilasHeader = ({ 
  activeLayer, 
  onLayerChange, 
  LAYER_CONFIG, 
  onCategoryPortalOpen,
  showCategoryNav,
  setShowCategoryNav
}) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const handleCategoryClick = (category) => {
    onLayerChange(category);
    onCategoryPortalOpen(category);
    setShowCategoryNav(false);
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      Faith: 'Religious and spiritual community activities',
      Commerce: 'Local businesses and economic opportunities',
      Works: 'Community projects and infrastructure',
      Circle: 'Social gatherings and community events',
      Mind: 'Education and learning opportunities',
      Pulse: 'Health and wellness activities',
      All: 'View all community activities'
    };
    return descriptions[category] || 'Community activities';
  };

  const getCategoryStats = (category) => {
    // Mock stats - replace with real data
    const stats = {
      Faith: { pins: 24, active: 8 },
      Commerce: { pins: 31, active: 12 },
      Works: { pins: 18, active: 6 },
      Circle: { pins: 42, active: 15 },
      Mind: { pins: 27, active: 9 },
      Pulse: { pins: 33, active: 11 },
      All: { pins: 175, active: 61 }
    };
    return stats[category] || { pins: 0, active: 0 };
  };

  return (
    <>
      {/* SILAS Branded Header */}
      <header 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300"
        style={{
          background: SILAS_BRANDING.components.panel.background,
          backdropFilter: SILAS_BRANDING.components.panel.backdrop,
          border: SILAS_BRANDING.components.panel.border,
          boxShadow: SILAS_BRANDING.components.panel.shadow,
          borderRadius: SILAS_BRANDING.components.panel.borderRadius
        }}
      >
        <div className="flex items-center px-6 py-3">
          {/* SILAS Logo and Brand */}
          <div className="flex items-center mr-6">
            <img 
              src={silasLogo} 
              alt="SILAS" 
              className="h-8 w-8 mr-3"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2))' }}
            />
            <div 
              className="font-bold text-xl"
              style={{ 
                color: SILAS_BRANDING.colors.primary,
                fontFamily: SILAS_BRANDING.typography.fontFamily.heading,
                textShadow: '0 1px 2px rgba(37, 99, 235, 0.1)'
              }}
            >
              SILAS
            </div>
          </div>

          {/* Central Navigation Button */}
          <button
            onClick={() => setShowCategoryNav(!showCategoryNav)}
            className="flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105"
            style={{
              background: showCategoryNav 
                ? getCategoryGradient(activeLayer)
                : SILAS_BRANDING.components.button.primary.background,
              color: SILAS_BRANDING.components.button.primary.text,
              boxShadow: showCategoryNav 
                ? `0 4px 14px 0 ${getCategoryColor(activeLayer)}66`
                : SILAS_BRANDING.components.button.primary.shadow,
              fontSize: SILAS_BRANDING.typography.fontSize.sm
            }}
          >
            {showCategoryNav ? (
              <X className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
            <span>Categories</span>
            {!showCategoryNav && (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Active Layer Indicator */}
          {activeLayer && activeLayer !== 'All' && (
            <div 
              className="ml-4 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                background: `${getCategoryColor(activeLayer)}20`,
                color: getCategoryColor(activeLayer),
                border: `1px solid ${getCategoryColor(activeLayer)}40`
              }}
            >
              {activeLayer}
            </div>
          )}
        </div>
      </header>

      {/* Category Navigation Sidebar */}
      {showCategoryNav && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-30 transition-opacity duration-300"
            onClick={() => setShowCategoryNav(false)}
          />

          {/* Category Sidebar */}
          <div 
            className="fixed left-0 top-0 h-full w-80 z-40 transition-transform duration-300 overflow-y-auto"
            style={{
              background: SILAS_BRANDING.components.panel.background,
              backdropFilter: SILAS_BRANDING.components.panel.backdrop,
              border: SILAS_BRANDING.components.panel.border,
              boxShadow: SILAS_BRANDING.components.panel.shadow
            }}
          >
            {/* Sidebar Header */}
            <div 
              className="p-6 border-b"
              style={{ borderColor: SILAS_BRANDING.colors.gray[200] }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 
                    className="text-xl font-bold"
                    style={{ 
                      color: SILAS_BRANDING.colors.primary,
                      fontFamily: SILAS_BRANDING.typography.fontFamily.heading
                    }}
                  >
                    Community Categories
                  </h2>
                  <p 
                    className="text-sm mt-1"
                    style={{ color: SILAS_BRANDING.colors.gray[600] }}
                  >
                    Explore different aspects of your community
                  </p>
                </div>
                <button
                  onClick={() => setShowCategoryNav(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" style={{ color: SILAS_BRANDING.colors.gray[500] }} />
                </button>
              </div>
            </div>

            {/* Category List */}
            <div className="p-4 space-y-2">
              {Object.keys(LAYER_CONFIG).map((category) => {
                const isActive = activeLayer === category;
                const isHovered = hoveredCategory === category;
                const stats = getCategoryStats(category);
                const IconComponent = LAYER_CONFIG[category].icon;

                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    onMouseEnter={() => setHoveredCategory(category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="w-full p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: isActive || isHovered 
                        ? getCategoryGradient(category)
                        : SILAS_BRANDING.components.card.background,
                      border: isActive 
                        ? `2px solid ${getCategoryColor(category)}`
                        : SILAS_BRANDING.components.card.border,
                      boxShadow: isActive || isHovered
                        ? `0 8px 25px -5px ${getCategoryColor(category)}40`
                        : SILAS_BRANDING.components.card.shadow,
                      color: isActive || isHovered 
                        ? '#FFFFFF'
                        : SILAS_BRANDING.colors.gray[800]
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Category Icon */}
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isActive || isHovered 
                            ? 'rgba(255, 255, 255, 0.2)'
                            : `${getCategoryColor(category)}15`,
                          color: isActive || isHovered 
                            ? '#FFFFFF'
                            : getCategoryColor(category)
                        }}
                      >
                        <IconComponent className="h-6 w-6" />
                      </div>

                      {/* Category Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 
                            className="font-semibold"
                            style={{ 
                              fontSize: SILAS_BRANDING.typography.fontSize.base,
                              fontFamily: SILAS_BRANDING.typography.fontFamily.heading
                            }}
                          >
                            {category}
                          </h3>
                          <div className="flex items-center space-x-2 text-xs">
                            <span 
                              className="px-2 py-1 rounded-full"
                              style={{
                                background: isActive || isHovered 
                                  ? 'rgba(255, 255, 255, 0.2)'
                                  : `${getCategoryColor(category)}20`,
                                color: isActive || isHovered 
                                  ? '#FFFFFF'
                                  : getCategoryColor(category)
                              }}
                            >
                              {stats.pins} pins
                            </span>
                          </div>
                        </div>
                        
                        <p 
                          className="text-sm opacity-90 mb-2"
                          style={{ 
                            fontSize: SILAS_BRANDING.typography.fontSize.sm,
                            lineHeight: '1.4'
                          }}
                        >
                          {getCategoryDescription(category)}
                        </p>

                        <div className="flex items-center space-x-4 text-xs">
                          <div className="flex items-center space-x-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{
                                background: isActive || isHovered 
                                  ? 'rgba(255, 255, 255, 0.6)'
                                  : getCategoryColor(category)
                              }}
                            />
                            <span>{stats.active} active</span>
                          </div>
                          <span>•</span>
                          <span>Updated recently</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div 
              className="p-6 border-t mt-auto"
              style={{ borderColor: SILAS_BRANDING.colors.gray[200] }}
            >
              <div 
                className="text-center text-xs"
                style={{ color: SILAS_BRANDING.colors.gray[500] }}
              >
                <div className="font-medium mb-1">SILAS Platform</div>
                <div>Stoneclough Initiative for Local & Autonomous Systems</div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SilasHeader;
