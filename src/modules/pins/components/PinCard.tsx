import React from 'react';
import { MapPin, Calendar, User, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '@/core/components/Button';
import { cn } from '@/core/utils/cn';
import type { Pin } from '../types/pin.types';

export interface PinCardProps {
  pin: Pin;
  onClick?: (pin: Pin) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export const PinCard: React.FC<PinCardProps> = ({
  pin,
  onClick,
  showActions = true,
  compact = false,
  className
}) => {
  const categoryColor = pin.category?.color || '#4C764C';
  
  const handleCardClick = () => {
    onClick?.(pin);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority: Pin['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'normal': return 'text-gray-500';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer',
        'border-l-4 overflow-hidden',
        compact ? 'p-3' : 'p-4',
        className
      )}
      style={{ borderLeftColor: categoryColor }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-gray-900 truncate',
            compact ? 'text-sm' : 'text-base'
          )}>
            {pin.name}
          </h3>
          
          <div className="flex items-center space-x-2 mt-1">
            <span 
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: `${categoryColor}20`,
                color: categoryColor 
              }}
            >
              {pin.category?.name}
            </span>
            
            {pin.priority !== 'normal' && (
              <span className={cn('text-xs font-medium', getPriorityColor(pin.priority))}>
                {pin.priority.toUpperCase()}
              </span>
            )}
            
            {pin.fund_eligible && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Fund Eligible
              </span>
            )}
          </div>
        </div>

        {pin.is_verified && (
          <div className="ml-2 flex-shrink-0">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {pin.description}
        </p>
      )}

      {/* Photo */}
      {pin.photos && pin.photos.length > 0 && (
        <div className="mb-3">
          <img
            src={pin.photos[0].url}
            alt={pin.photos[0].alt_text || pin.name}
            className="w-full h-32 object-cover rounded-md"
          />
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <MapPin className="w-3 h-3" />
            <span>{pin.address?.formatted || 'Stoneclough'}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(pin.created_at)}</span>
          </div>
          
          {pin.creator && (
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{pin.creator.display_name || 'Anonymous'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {pin.tags && pin.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {pin.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
            >
              #{tag}
            </span>
          ))}
          {pin.tags.length > 3 && (
            <span className="text-xs text-gray-400">
              +{pin.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <button className="flex items-center space-x-1 hover:text-red-500 transition-colors">
              <Heart className="w-4 h-4" />
              <span>{pin.social_counts?.likes || 0}</span>
            </button>
            
            <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>{pin.social_counts?.comments || 0}</span>
            </button>
            
            <button className="flex items-center space-x-1 hover:text-green-500 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>{pin.social_counts?.shares || 0}</span>
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(pin);
            }}
          >
            View Details
          </Button>
        </div>
      )}
    </div>
  );
};
