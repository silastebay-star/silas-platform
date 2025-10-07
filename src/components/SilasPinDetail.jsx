import React, { useState } from 'react';
import { X, MapPin, Calendar, User, ThumbsUp, MessageCircle, Share2, Heart, Send, MoreHorizontal } from 'lucide-react';
import { SILAS_BRANDING, getCategoryColor, getCategoryGradient } from '../styles/silasBranding.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import silasLogo from '../assets/silas-logo.png';

const SilasPinDetail = ({ 
  pin, 
  isOpen, 
  onClose, 
  onReaction, 
  onComment, 
  onShare,
  comments = [],
  LAYER_CONFIG 
}) => {
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [activeReaction, setActiveReaction] = useState(null);

  if (!isOpen || !pin) return null;

  const categoryColor = getCategoryColor(pin.layer);
  const categoryGradient = getCategoryGradient(pin.layer);
  const IconComponent = LAYER_CONFIG[pin.layer]?.icon || MapPin;

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

  const handleReaction = (type) => {
    setActiveReaction(type);
    onReaction && onReaction(pin.id, type);
    setTimeout(() => setActiveReaction(null), 300);
  };

  const handleComment = () => {
    if (newComment.trim()) {
      onComment && onComment(pin.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleShare = (platform = 'internal') => {
    onShare && onShare(pin.id, platform);
  };

  const displayComments = showAllComments ? comments : comments.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] mx-4 transition-all duration-300 transform overflow-hidden"
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
            borderColor: `${categoryColor}30`
          }}
        >
          <div className="flex items-start justify-between text-white">
            <div className="flex items-start space-x-4 flex-1">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255, 255, 255, 0.2)' }}
              >
                <IconComponent className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <img 
                    src={silasLogo} 
                    alt="SILAS" 
                    className="h-6 w-6"
                    style={{ filter: 'brightness(0) invert(1)' }}
                  />
                  <span 
                    className="text-sm font-medium opacity-90"
                    style={{ fontFamily: SILAS_BRANDING.typography.fontFamily.heading }}
                  >
                    SILAS • {pin.layer}
                  </span>
                </div>
                <h1 
                  className="text-2xl font-bold mb-2"
                  style={{ fontFamily: SILAS_BRANDING.typography.fontFamily.heading }}
                >
                  {pin.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm opacity-90">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{pin.created_by || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatTimeAgo(pin.created_at)}</span>
                  </div>
                  {pin.coordinates && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {pin.coordinates[1].toFixed(4)}, {pin.coordinates[0].toFixed(4)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Description */}
            <div className="mb-6">
              <p 
                className="text-lg leading-relaxed"
                style={{ 
                  color: SILAS_BRANDING.colors.gray[700],
                  fontFamily: SILAS_BRANDING.typography.fontFamily.primary
                }}
              >
                {pin.description}
              </p>
            </div>

            {/* Photos */}
            {pin.metadata?.photos && pin.metadata.photos.length > 0 && (
              <div className="mb-6">
                <h3 
                  className="text-lg font-semibold mb-3"
                  style={{ color: SILAS_BRANDING.colors.gray[800] }}
                >
                  Photos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {pin.metadata.photos.map((photo, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <img 
                        src={photo.url} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            {pin.metadata && Object.keys(pin.metadata).length > 0 && (
              <div className="mb-6">
                <h3 
                  className="text-lg font-semibold mb-3"
                  style={{ color: SILAS_BRANDING.colors.gray[800] }}
                >
                  Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {pin.metadata.priority && (
                    <div>
                      <span className="text-sm font-medium" style={{ color: SILAS_BRANDING.colors.gray[600] }}>
                        Priority:
                      </span>
                      <span 
                        className="ml-2 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: pin.metadata.priority === 'high' 
                            ? SILAS_BRANDING.colors.warning + '20'
                            : SILAS_BRANDING.colors.success + '20',
                          color: pin.metadata.priority === 'high' 
                            ? SILAS_BRANDING.colors.warning
                            : SILAS_BRANDING.colors.success
                        }}
                      >
                        {pin.metadata.priority}
                      </span>
                    </div>
                  )}
                  {pin.metadata.accuracy && (
                    <div>
                      <span className="text-sm font-medium" style={{ color: SILAS_BRANDING.colors.gray[600] }}>
                        Location Accuracy:
                      </span>
                      <span className="ml-2 text-sm" style={{ color: SILAS_BRANDING.colors.gray[800] }}>
                        {Math.round(pin.metadata.accuracy)}m
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Social Actions */}
            <div 
              className="flex items-center justify-between p-4 rounded-xl mb-6"
              style={{ 
                background: SILAS_BRANDING.colors.gray[50],
                border: `1px solid ${SILAS_BRANDING.colors.gray[200]}`
              }}
            >
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => handleReaction('like')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    activeReaction === 'like' ? 'scale-110' : ''
                  }`}
                  style={{
                    background: activeReaction === 'like' 
                      ? SILAS_BRANDING.colors.primary + '20'
                      : 'transparent',
                    color: SILAS_BRANDING.colors.primary
                  }}
                >
                  <ThumbsUp className="h-5 w-5" />
                  <span className="font-medium">{pin.reactions?.like || 0}</span>
                </button>

                <button
                  onClick={() => handleReaction('love')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    activeReaction === 'love' ? 'scale-110' : ''
                  }`}
                  style={{
                    background: activeReaction === 'love' 
                      ? SILAS_BRANDING.colors.error + '20'
                      : 'transparent',
                    color: SILAS_BRANDING.colors.error
                  }}
                >
                  <Heart className="h-5 w-5" />
                  <span className="font-medium">{pin.reactions?.love || 0}</span>
                </button>

                <button
                  onClick={() => setShowAllComments(!showAllComments)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors"
                  style={{ color: SILAS_BRANDING.colors.success }}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-medium">{comments.length}</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleShare('internal')}
                  className="p-2 rounded-lg hover:bg-white transition-colors"
                  style={{ color: SILAS_BRANDING.colors.secondary }}
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  className="p-2 rounded-lg hover:bg-white transition-colors"
                  style={{ color: SILAS_BRANDING.colors.gray[500] }}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <h3 
                className="text-lg font-semibold mb-4"
                style={{ color: SILAS_BRANDING.colors.gray[800] }}
              >
                Comments ({comments.length})
              </h3>

              {/* Add Comment */}
              <div className="flex space-x-3 mb-6">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: categoryGradient }}
                >
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 flex space-x-2">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleComment}
                    disabled={!newComment.trim()}
                    style={{
                      background: categoryGradient,
                      border: 'none'
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {displayComments.map((comment, index) => (
                  <div key={index} className="flex space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${categoryColor}20` }}
                    >
                      <User className="h-4 w-4" style={{ color: categoryColor }} />
                    </div>
                    <div className="flex-1">
                      <div 
                        className="p-3 rounded-lg"
                        style={{ background: SILAS_BRANDING.colors.gray[50] }}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span 
                            className="font-medium text-sm"
                            style={{ color: SILAS_BRANDING.colors.gray[800] }}
                          >
                            {comment.author || 'Anonymous'}
                          </span>
                          <span 
                            className="text-xs"
                            style={{ color: SILAS_BRANDING.colors.gray[500] }}
                          >
                            {formatTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p 
                          className="text-sm"
                          style={{ color: SILAS_BRANDING.colors.gray[700] }}
                        >
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {comments.length > 3 && !showAllComments && (
                  <button
                    onClick={() => setShowAllComments(true)}
                    className="text-sm font-medium hover:underline"
                    style={{ color: categoryColor }}
                  >
                    View all {comments.length} comments
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SilasPinDetail;
