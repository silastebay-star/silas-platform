import React, { useState } from 'react';
import { X, MapPin, Heart, MessageCircle, Share2, Calendar, User, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePinsStore, type Pin } from '@/store/pins';

interface PinDetailProps {
  pin: Pin;
  isOpen: boolean;
  onClose: () => void;
}

const PIN_COLORS = {
  project: '#4C764C',
  business: '#10B981', 
  event: '#F59E0B',
  issue: '#EF4444',
  environment: '#059669',
  faith: '#8B5CF6',
  community: '#EC4899'
};

const PinDetail: React.FC<PinDetailProps> = ({ pin, isOpen, onClose }) => {
  const { updatePin, deletePin } = usePinsStore();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(pin.likes || 0);

  if (!isOpen) return null;

  const handleLike = async () => {
    const newLikesCount = isLiked ? likesCount - 1 : likesCount + 1;
    setIsLiked(!isLiked);
    setLikesCount(newLikesCount);
    
    // Update in store/database
    await updatePin(pin.id, { likes: newLikesCount });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pin.title,
        text: pin.description,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${pin.title}\n${pin.description}\nLocation: ${pin.lat}, ${pin.lng}`
      );
      alert('Pin details copied to clipboard!');
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this pin?')) {
      await deletePin(pin.id);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          {/* Photos */}
          {pin.photos && pin.photos.length > 0 ? (
            <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
              <img
                src={pin.photos[0]}
                alt={pin.title}
                className="w-full h-full object-cover"
              />
              {pin.photos.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  +{pin.photos.length - 1} more
                </div>
              )}
            </div>
          ) : (
            <div 
              className="h-48 rounded-t-lg flex items-center justify-center"
              style={{ backgroundColor: `${PIN_COLORS[pin.type]}20` }}
            >
              <MapPin 
                className="w-16 h-16"
                style={{ color: PIN_COLORS[pin.type] }}
              />
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Pin Type Badge */}
          <div className="absolute top-4 left-4">
            <span 
              className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: PIN_COLORS[pin.type] }}
            >
              {pin.type.charAt(0).toUpperCase() + pin.type.slice(1)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Category */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{pin.title}</h2>
            {pin.category && (
              <p className="text-sm text-gray-600">{pin.category}</p>
            )}
          </div>

          {/* Description */}
          {pin.description && (
            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed">{pin.description}</p>
            </div>
          )}

          {/* Location */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Added {formatDate(pin.created_at)}</span>
            </div>
            
            {pin.created_by && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>By {pin.created_by}</span>
              </div>
            )}
          </div>

          {/* Social Actions */}
          <div className="flex items-center justify-between py-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{likesCount}</span>
              </button>

              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{pin.comments || 0}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>

            {/* Admin Actions */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Comments</h3>
            
            {/* Comment Input */}
            <div className="mb-4">
              <textarea
                placeholder="Add a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#4C764C] focus:border-transparent"
                rows={2}
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" className="bg-[#4C764C] hover:bg-[#3d5f3d]">
                  Post Comment
                </Button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
              {/* Sample comment */}
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">Community Member</span>
                      <span className="text-xs text-gray-500">2 hours ago</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      This is a great addition to our community! Looking forward to seeing it develop.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinDetail;
