import React, { useState } from 'react';
import { 
  BookOpen, Calendar, Users, Heart, Share2, MessageCircle, 
  Star, Play, Upload, Download, Bell, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SILAS_BRANDING, getCategoryColor } from '../styles/silasBranding.js';
import { SILAS_CATEGORY_FRAMEWORK } from '../config/categoryFramework.js';

const CategorySocialFeatures = ({ 
  category, 
  pin, 
  onFeatureAction,
  userRole = 'member' // member, leader, admin
}) => {
  const [activeTab, setActiveTab] = useState('discussions');
  const [newContent, setNewContent] = useState('');

  const categoryData = SILAS_CATEGORY_FRAMEWORK[category];
  const categoryColor = getCategoryColor(category);
  const socialFeatures = categoryData?.socialFeatures || {};

  // Faith & Fellowship specific features
  const FaithFeatures = () => (
    <div className="space-y-4">
      {activeTab === 'discussions' && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: categoryColor }}>
            Scripture Discussions
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: `${categoryColor}10` }}>
              <div className="flex items-start space-x-3">
                <BookOpen className="h-5 w-5 mt-1" style={{ color: categoryColor }} />
                <div>
                  <p className="text-sm font-medium">Today's Scripture Reflection</p>
                  <p className="text-xs text-gray-600 mt-1">
                    "For where two or three gather in my name, there am I with them." - Matthew 18:20
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>12 reflections</span>
                    <span>•</span>
                    <span>3 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Input
                placeholder="Share your reflection..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => onFeatureAction('addReflection', newContent)}
                style={{ background: categoryColor }}
              >
                Share
              </Button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: categoryColor }}>
            Sermons & Livestreams
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Sunday Service - Live</span>
                <div className="flex items-center space-x-1 text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs">LIVE</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button size="sm" style={{ background: categoryColor }}>
                  <Play className="h-4 w-4 mr-1" />
                  Join Stream
                </Button>
                <span className="text-xs text-gray-500">47 watching</span>
              </div>
            </div>

            {userRole === 'leader' && (
              <Button 
                onClick={() => onFeatureAction('uploadSermon')}
                variant="outline" 
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Sermon
              </Button>
            )}
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: categoryColor }}>
            Parish Events
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5" style={{ color: categoryColor }} />
                <div>
                  <p className="font-medium">Bible Study Group</p>
                  <p className="text-sm text-gray-600">Every Wednesday, 7:00 PM</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button size="sm" style={{ background: categoryColor }}>
                      Join Group
                    </Button>
                    <span className="text-xs text-gray-500">12 members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Commerce & Trade specific features
  const CommerceFeatures = () => (
    <div className="space-y-4">
      {activeTab === 'discussions' && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: categoryColor }}>
            Business Networking
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: `${categoryColor}10` }}>
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 mt-1" style={{ color: categoryColor }} />
                <div>
                  <p className="text-sm font-medium">Local Business Collaboration</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Looking for partners for the upcoming farmers market season
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>8 interested</span>
                    <span>•</span>
                    <span>2 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: categoryColor }}>
            Local Deals & Offers
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">20% Off Local Honey</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Fresh local honey from Stoneclough Apiaries
              </p>
              <Button size="sm" style={{ background: categoryColor }}>
                Claim Offer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Works & Infrastructure specific features
  const WorksFeatures = () => (
    <div className="space-y-4">
      {activeTab === 'discussions' && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: categoryColor }}>
            Project Planning
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg" style={{ background: `${categoryColor}10` }}>
              <div className="flex items-start space-x-3">
                <Settings className="h-5 w-5 mt-1" style={{ color: categoryColor }} />
                <div>
                  <p className="text-sm font-medium">Community Solar Project Update</p>
                  <p className="text-xs text-gray-600 mt-1">
                    Phase 1 installation scheduled for next month. Volunteers needed!
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>15 volunteers</span>
                    <span>•</span>
                    <span>1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'collaboration' && (
        <div>
          <h4 className="font-semibold mb-3" style={{ color: categoryColor }}>
            Volunteer Coordination
          </h4>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Weekend Work Day</span>
                <Button size="sm" style={{ background: categoryColor }}>
                  Sign Up
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Help install solar panels at the community center
              </p>
              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-500">
                <span>Saturday 9 AM - 3 PM</span>
                <span>•</span>
                <span>8/15 volunteers</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Get appropriate feature component based on category
  const getCategoryFeatures = () => {
    switch (category) {
      case 'faith':
        return <FaithFeatures />;
      case 'commerce':
        return <CommerceFeatures />;
      case 'works':
        return <WorksFeatures />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">
              Specialized features for {categoryData?.name} coming soon!
            </p>
          </div>
        );
    }
  };

  // Get tabs based on category
  const getCategoryTabs = () => {
    const tabs = [];
    if (socialFeatures.discussions) tabs.push({ key: 'discussions', label: 'Discussions', icon: MessageCircle });
    if (socialFeatures.content) tabs.push({ key: 'content', label: 'Content', icon: Play });
    if (socialFeatures.events) tabs.push({ key: 'events', label: 'Events', icon: Calendar });
    if (socialFeatures.collaboration) tabs.push({ key: 'collaboration', label: 'Collaborate', icon: Users });
    return tabs;
  };

  const tabs = getCategoryTabs();

  return (
    <div 
      className="rounded-xl overflow-hidden"
      style={{
        background: SILAS_BRANDING.components.card.background,
        border: `1px solid ${categoryColor}30`,
        boxShadow: `0 4px 12px ${categoryColor}20`
      }}
    >
      {/* Header */}
      <div 
        className="p-4 border-b"
        style={{ 
          background: `${categoryColor}10`,
          borderColor: `${categoryColor}30`
        }}
      >
        <h3 
          className="font-semibold"
          style={{ color: categoryColor }}
        >
          {categoryData?.name} Social Hub
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {categoryData?.description}
        </p>
      </div>

      {/* Tabs */}
      {tabs.length > 0 && (
        <div 
          className="flex border-b"
          style={{ borderColor: `${categoryColor}20` }}
        >
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === key 
                  ? 'border-b-2 border-current' 
                  : 'hover:bg-gray-50'
              }`}
              style={{
                color: activeTab === key ? categoryColor : SILAS_BRANDING.colors.gray[600],
                borderColor: activeTab === key ? categoryColor : 'transparent'
              }}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {getCategoryFeatures()}
      </div>
    </div>
  );
};

export default CategorySocialFeatures;
