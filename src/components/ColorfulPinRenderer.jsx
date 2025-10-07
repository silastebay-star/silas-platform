import React from 'react';
import { getCategoryColor } from '../styles/silasBranding.js';
import { SILAS_CATEGORY_FRAMEWORK } from '../config/categoryFramework.js';

const ColorfulPinRenderer = ({ pin, onClick, isSelected = false, size = 'medium' }) => {
  const categoryColor = getCategoryColor(pin.layer);
  const categoryData = SILAS_CATEGORY_FRAMEWORK[pin.layer];
  const IconComponent = categoryData?.icon;

  // Size configurations
  const sizeConfig = {
    small: { width: 24, height: 24, iconSize: 12 },
    medium: { width: 32, height: 32, iconSize: 16 },
    large: { width: 48, height: 48, iconSize: 24 },
    xlarge: { width: 64, height: 64, iconSize: 32 }
  };

  const { width, height, iconSize } = sizeConfig[size];

  // Priority indicators
  const getPriorityRing = () => {
    if (pin.priority === 'urgent') return '#EF4444';
    if (pin.priority === 'high') return '#F59E0B';
    return 'transparent';
  };

  // Activity indicator (based on reactions and comments)
  const getActivityLevel = () => {
    const totalActivity = (pin.reactions?.like || 0) + 
                         (pin.reactions?.love || 0) + 
                         (pin.comments || 0);
    if (totalActivity > 50) return 'high';
    if (totalActivity > 20) return 'medium';
    return 'low';
  };

  const activityLevel = getActivityLevel();

  return (
    <div
      onClick={() => onClick && onClick(pin)}
      className={`relative cursor-pointer transition-all duration-300 hover:scale-110 ${
        isSelected ? 'scale-125 z-10' : ''
      }`}
      style={{ width, height }}
    >
      {/* Priority Ring */}
      {pin.priority !== 'normal' && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            border: `3px solid ${getPriorityRing()}`,
            transform: 'scale(1.2)'
          }}
        />
      )}

      {/* Activity Pulse */}
      {activityLevel === 'high' && (
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            backgroundColor: categoryColor,
            opacity: 0.3,
            transform: 'scale(1.4)'
          }}
        />
      )}

      {/* Main Pin Body */}
      <div
        className={`w-full h-full rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isSelected ? 'ring-4 ring-white ring-opacity-70' : ''
        }`}
        style={{
          backgroundColor: categoryColor,
          background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}CC 100%)`,
          boxShadow: isSelected 
            ? `0 8px 25px -5px ${categoryColor}60, 0 0 0 4px rgba(255, 255, 255, 0.7)`
            : `0 4px 12px -2px ${categoryColor}40`
        }}
      >
        {/* Category Icon */}
        {IconComponent && (
          <IconComponent 
            className="text-white drop-shadow-sm" 
            size={iconSize}
          />
        )}
      </div>

      {/* Activity Indicator Dots */}
      {activityLevel !== 'low' && (
        <div className="absolute -top-1 -right-1 flex space-x-1">
          <div
            className={`w-2 h-2 rounded-full ${
              activityLevel === 'high' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
            }`}
          />
        </div>
      )}

      {/* Pin Label (for larger sizes) */}
      {size === 'large' || size === 'xlarge' ? (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
          <div 
            className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap max-w-32 truncate"
            style={{ fontSize: size === 'xlarge' ? '0.75rem' : '0.625rem' }}
          >
            {pin.name}
          </div>
        </div>
      ) : null}

      {/* Hover Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none z-20">
        <div 
          className="bg-white rounded-lg shadow-xl border p-3 min-w-48 max-w-64"
          style={{ borderColor: `${categoryColor}40` }}
        >
          <div className="flex items-start space-x-2">
            <div 
              className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
              style={{ backgroundColor: categoryColor }}
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm truncate">
                {pin.name}
              </h4>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {pin.description}
              </p>
              <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center space-x-1">
                  <span>👍</span>
                  <span>{pin.reactions?.like || 0}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>💬</span>
                  <span>{pin.comments || 0}</span>
                </span>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${categoryColor}20`,
                    color: categoryColor
                  }}
                >
                  {categoryData?.name?.split(' & ')[0] || pin.layer}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pin cluster renderer for multiple pins in close proximity
export const PinCluster = ({ pins, onClick, center }) => {
  const dominantCategory = pins.reduce((acc, pin) => {
    acc[pin.layer] = (acc[pin.layer] || 0) + 1;
    return acc;
  }, {});

  const primaryCategory = Object.keys(dominantCategory).reduce((a, b) => 
    dominantCategory[a] > dominantCategory[b] ? a : b
  );

  const categoryColor = getCategoryColor(primaryCategory);
  const totalActivity = pins.reduce((sum, pin) => 
    sum + (pin.reactions?.like || 0) + (pin.reactions?.love || 0) + (pin.comments || 0), 0
  );

  return (
    <div
      onClick={() => onClick && onClick(pins, center)}
      className="relative cursor-pointer transition-all duration-300 hover:scale-110"
    >
      {/* Cluster Background */}
      <div
        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-bold"
        style={{
          backgroundColor: categoryColor,
          background: `linear-gradient(135deg, ${categoryColor} 0%, ${categoryColor}CC 100%)`,
          boxShadow: `0 4px 12px -2px ${categoryColor}40`
        }}
      >
        {pins.length}
      </div>

      {/* Activity Ring */}
      {totalActivity > 100 && (
        <div
          className="absolute inset-0 rounded-full animate-pulse"
          style={{
            border: `2px solid ${categoryColor}`,
            transform: 'scale(1.3)',
            opacity: 0.6
          }}
        />
      )}

      {/* Category Indicators */}
      <div className="absolute -bottom-1 -right-1 flex flex-wrap w-6">
        {Object.keys(dominantCategory).slice(0, 3).map((category, index) => (
          <div
            key={category}
            className="w-2 h-2 rounded-full border border-white"
            style={{ 
              backgroundColor: getCategoryColor(category),
              marginLeft: index > 0 ? '-2px' : '0'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorfulPinRenderer;
