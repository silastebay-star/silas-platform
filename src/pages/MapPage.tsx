import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Menu, X, MapPin } from 'lucide-react';
import MapRoot from '@/modules/pins/MapRoot';
import { usePinsStore } from '@/store/pins';

const MapPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const { pins, isLoading, error } = usePinsStore();

  const categories = [
    { id: 'all', name: 'All', color: '#4C764C' },
    { id: 'faith', name: 'Faith & Fellowship', color: '#8B5CF6' },
    { id: 'projects', name: 'Projects & Infrastructure', color: '#F59E0B' },
    { id: 'economy', name: 'Economy & Commerce', color: '#10B981' },
    { id: 'environment', name: 'Environment & Sustainability', color: '#059669' },
    { id: 'community', name: 'Community & Social', color: '#EF4444' },
    { id: 'wellbeing', name: 'Wellbeing & Health', color: '#EC4899' }
  ];

  const filteredPins = pins.filter(pin =>
    pin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pin.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-[#4C764C] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MapPin className="w-6 h-6" />
            <h1 className="text-xl font-bold">SILAS Community Map</h1>
          </div>
          <div className="text-sm">
            Stoneclough Initiative for Local & Autonomous Systems
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 bg-white shadow-lg flex flex-col overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Community Pins</h2>
              <Button
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                variant="outline"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search pins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'text-white'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : undefined
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Pin List */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C764C] mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading pins...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-500">Error: {error}</p>
              </div>
            )}

            {!isLoading && !error && filteredPins.length === 0 && (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No pins found</p>
                <p className="text-sm text-gray-400">Right-click on the map to add a new pin</p>
              </div>
            )}

            <div className="space-y-3">
              {filteredPins.map((pin) => (
                <div
                  key={pin.id}
                  className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => console.log('Selected pin:', pin)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 text-sm">{pin.title}</h3>
                      {pin.description && (
                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">{pin.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <span
                          className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: categories.find(c => c.id === pin.type)?.color || '#6B7280' }}
                        >
                          {pin.type}
                        </span>
                        {pin.category && (
                          <span className="text-xs text-gray-500">{pin.category}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapRoot className="w-full h-full" />

          {/* Toggle Sidebar Button */}
          {!showSidebar && (
            <div className="absolute top-4 left-4 z-10">
              <Button
                onClick={() => setShowSidebar(true)}
                variant="outline"
                size="sm"
                className="bg-white shadow-lg"
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;
