import React, { useState, useEffect } from 'react';
import { Bell, X, ThumbsUp, MessageCircle, Users, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NotificationSystem = ({ isVisible, onClose, notifications = [] }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [localNotifications, setLocalNotifications] = useState([]);

  useEffect(() => {
    setLocalNotifications(notifications);
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const markAsRead = (notificationId) => {
    setLocalNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
      case 'reaction':
        return <ThumbsUp className="h-4 w-4 text-blue-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'follow':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'love':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

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

  if (!isVisible) return null;

  return (
    <div className="fixed top-16 right-4 w-80 max-h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {localNotifications.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-sm font-medium text-gray-900 mb-2">No notifications yet</h4>
            <p className="text-xs text-gray-500">
              You'll see notifications here when people interact with your pins
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {localNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.pinName && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        📍 {notification.pinName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {localNotifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-gray-600 hover:text-gray-800"
            onClick={() => {
              // TODO: Navigate to full notifications page
              console.log('View all notifications');
            }}
          >
            View all notifications
          </Button>
        </div>
      )}
    </div>
  );
};

// Notification Bell Component for Header
export const NotificationBell = ({ notificationCount = 0, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <Bell className="h-5 w-5" />
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
          {notificationCount > 99 ? '99+' : notificationCount}
        </span>
      )}
    </button>
  );
};

export default NotificationSystem;
