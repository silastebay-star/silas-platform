import React, { useState } from 'react';
import { MapPin, Users, Calendar, MessageCircle, ThumbsUp, Share2, MoreHorizontal, Link, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PinCard = ({ 
  pin, 
  onPinClick, 
  onReaction, 
  onComment, 
  onShare,
  onJoinProject,
  isProjectParent = false,
  childPins = [],
  className = ""
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getLayerColor = (layer) => {
    const colors = {
      Faith: '#8B5CF6',
      Commerce: '#10B981',
      Works: '#F59E0B',
      Circle: '#EF4444',
      Mind: '#3B82F6',
      Pulse: '#EC4899'
    };
    return colors[layer] || '#6B7280';
  };

  const getPriorityBadge = (priority) => {
    if (!priority || priority === 'normal') return null;
    
    const badges = {
      high: { color: 'bg-orange-100 text-orange-800', label: 'High Priority' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
    };
    
    const badge = badges[priority];
    if (!badge) return null;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 ${className}`}>
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Layer Indicator */}
            <div 
              className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
              style={{ backgroundColor: getLayerColor(pin.layer) }}
            />
            
            <div className="flex-1 min-w-0">
              {/* Title and Priority */}
              <div className="flex items-start justify-between mb-2">
                <h3 
                  className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => onPinClick(pin)}
                >
                  {pin.name}
                </h3>
                <div className="flex items-center space-x-2 ml-2">
                  {getPriorityBadge(pin.metadata?.priority)}
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Meta Information */}
              <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                <span className="font-medium" style={{ color: getLayerColor(pin.layer) }}>
                  {pin.layer}
                </span>
                <span>•</span>
                <span>{formatTimeAgo(pin.created_at)}</span>
                <span>•</span>
                <span>{pin.created_by || 'Anonymous'}</span>
              </div>

              {/* Description */}
              <p className={`text-gray-600 text-sm leading-relaxed ${
                isExpanded ? '' : 'line-clamp-2'
              }`}>
                {pin.description}
              </p>

              {/* Expand/Collapse for long descriptions */}
              {pin.description && pin.description.length > 100 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 text-xs mt-1 hover:text-blue-800 transition-colors"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Project Children Preview */}
        {isProjectParent && childPins.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700 flex items-center">
                <Link className="h-3 w-3 mr-1" />
                Project Components ({childPins.length})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {childPins.slice(0, 4).map((childPin) => (
                <div
                  key={childPin.id}
                  onClick={() => onPinClick(childPin)}
                  className="p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getLayerColor(childPin.layer) }}
                    />
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {childPin.name}
                    </span>
                  </div>
                </div>
              ))}
              {childPins.length > 4 && (
                <div className="p-2 bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-500">
                    +{childPins.length - 4} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos Preview */}
        {pin.metadata?.photos && pin.metadata.photos.length > 0 && (
          <div className="mt-3">
            <div className="flex space-x-2 overflow-x-auto">
              {pin.metadata.photos.slice(0, 3).map((photo, index) => (
                <div key={index} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={photo.url} 
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {pin.metadata.photos.length > 3 && (
                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-500">
                    +{pin.metadata.photos.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          {/* Social Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onReaction(pin.id, 'like')}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs">{pin.reactions?.like || 0}</span>
            </button>
            
            <button
              onClick={() => onComment(pin.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{pin.comments || 0}</span>
            </button>
            
            <button
              onClick={() => onShare(pin.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          {/* Project Join Button */}
          {(isProjectParent || pin.layer === 'Works') && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onJoinProject(pin.id)}
              className="text-xs"
            >
              <Users className="h-3 w-3 mr-1" />
              Join
            </Button>
          )}
        </div>
      </div>

      {/* Actions Dropdown */}
      {showActions && (
        <div className="absolute right-4 top-16 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
          <button
            onClick={() => {
              onPinClick(pin);
              setShowActions(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => {
              // TODO: Implement edit functionality
              setShowActions(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Edit Pin
          </button>
          <button
            onClick={() => {
              onShare(pin.id);
              setShowActions(false);
            }}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Share
          </button>
          {isProjectParent && (
            <button
              onClick={() => {
                // TODO: Implement manage project functionality
                setShowActions(false);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Manage Project
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PinCard;
