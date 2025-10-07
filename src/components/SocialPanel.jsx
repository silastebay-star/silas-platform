import React, { useState, useMemo, useEffect } from 'react';
import { X, MessageCircle, ThumbsUp, Heart, Share2, Users, TrendingUp, Filter, Search, Plus, Send, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabaseHelpers } from '../lib/supabase.js';

const SocialPanel = ({ pins, activeLayer, onItemClick, onClose, isVisible }) => {
  const [activeTab, setActiveTab] = useState('feed');
  const [sortBy, setSortBy] = useState('recent');
  const [searchTerm, setSearchTerm] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedPin, setSelectedPin] = useState(null);
  const [comments, setComments] = useState({});
  const [reactions, setReactions] = useState({});
  const [loading, setLoading] = useState(false);

  // Load comments for a pin
  const loadComments = async (pinId) => {
    try {
      const pinComments = await supabaseHelpers.getComments(pinId);
      setComments(prev => ({ ...prev, [pinId]: pinComments }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Add reaction to pin
  const handleReaction = async (pinId, reactionType) => {
    try {
      await supabaseHelpers.addFeedback(pinId, reactionType, 'anonymous');
      await supabaseHelpers.logActivity('reaction_added', { pin_id: pinId, type: reactionType });
      
      // Update local reactions count
      setReactions(prev => ({
        ...prev,
        [pinId]: {
          ...prev[pinId],
          [reactionType]: (prev[pinId]?.[reactionType] || 0) + 1
        }
      }));
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Add comment to pin
  const handleAddComment = async (pinId) => {
    if (!newComment.trim()) return;
    
    try {
      setLoading(true);
      await supabaseHelpers.addComment(pinId, newComment, 'anonymous');
      await supabaseHelpers.logActivity('comment_added', { pin_id: pinId });
      
      setNewComment('');
      await loadComments(pinId);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced feed items with social data
  const feedItems = useMemo(() => {
    let items = pins.map(pin => ({
      id: pin.id,
      type: pin.layer?.toLowerCase() || 'general',
      title: pin.name,
      description: pin.description,
      coords: pin.coordinates,
      layer: pin.layer,
      reactions: {
        like: pin.feedback?.filter(f => f.type === 'like')?.length || 0,
        love: pin.feedback?.filter(f => f.type === 'love')?.length || 0,
        support: pin.feedback?.filter(f => f.type === 'support')?.length || 0,
        total: pin.feedback?.[0]?.count || 0
      },
      comments: pin.comments?.[0]?.count || 0,
      created_at: pin.created_at,
      updated_at: pin.updated_at || pin.created_at,
      author: pin.created_by || 'Anonymous',
      metadata: pin.metadata || {}
    }));

    // Filter by search term
    if (searchTerm) {
      items = items.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by active layer
    if (activeLayer !== "All") {
      items = items.filter(item => item.layer === activeLayer);
    }

    // Sort items
    items.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.reactions.total + b.comments) - (a.reactions.total + a.comments);
        case 'discussed':
          return b.comments - a.comments;
        case 'recent':
        default:
          return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });

    return items.slice(0, 20);
  }, [pins, activeLayer, sortBy, searchTerm]);

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

  if (!isVisible) return null;

  return (
    <div className={`fixed top-0 h-full bg-white shadow-2xl z-40 flex flex-col border-l border-gray-200 transition-transform duration-300 ${
      window.innerWidth <= 768
        ? 'right-0 w-full'
        : 'right-0 w-96'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-gray-900">Community Social</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'feed', label: 'Feed', icon: MessageCircle },
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'community', label: 'Community', icon: Users }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="p-3 border-b border-gray-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>

        {/* Sort Options */}
        <div className="flex space-x-2">
          {[
            { id: 'recent', label: 'Recent' },
            { id: 'popular', label: 'Popular' },
            { id: 'discussed', label: 'Most Discussed' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setSortBy(option.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                sortBy === option.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'feed' && (
          <div className="space-y-1">
            {feedItems.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No posts yet</h3>
                <p className="text-xs text-gray-500 mb-4">Be the first to add content to this layer!</p>
                <Button size="sm" className="text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Create Pin
                </Button>
              </div>
            ) : (
              feedItems.map((item) => (
                <div key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="p-4">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getLayerColor(item.layer) }}
                        />
                        <span className="text-xs font-medium text-gray-600">{item.layer}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{formatTimeAgo(item.created_at)}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Post Content */}
                    <div 
                      className="cursor-pointer"
                      onClick={() => onItemClick(item)}
                    >
                      <h4 className="font-medium text-gray-900 mb-1 text-sm leading-tight">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    {/* Reactions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleReaction(item.id, 'like')}
                          className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span className="text-xs">{item.reactions.like}</span>
                        </button>
                        <button
                          onClick={() => handleReaction(item.id, 'love')}
                          className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Heart className="h-4 w-4" />
                          <span className="text-xs">{item.reactions.love}</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPin(selectedPin === item.id ? null : item.id);
                            if (selectedPin !== item.id) {
                              loadComments(item.id);
                            }
                          }}
                          className="flex items-center space-x-1 text-gray-500 hover:text-green-600 transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-xs">{item.comments}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {selectedPin === item.id && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {/* Existing Comments */}
                        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                          {comments[item.id]?.map((comment) => (
                            <div key={comment.id} className="text-xs">
                              <span className="font-medium text-gray-700">{comment.author || 'Anonymous'}</span>
                              <span className="text-gray-600 ml-2">{comment.content}</span>
                              <span className="text-gray-400 ml-2">{formatTimeAgo(comment.created_at)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Add Comment */}
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1 h-8 text-xs"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(item.id)}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(item.id)}
                            disabled={!newComment.trim() || loading}
                            className="h-8 px-3"
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="p-4">
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">Trending Content</h3>
              <p className="text-xs text-gray-500">Popular posts and discussions will appear here</p>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="p-4">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-sm font-medium text-gray-900 mb-2">Community Members</h3>
              <p className="text-xs text-gray-500">Community member profiles and activity will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialPanel;
