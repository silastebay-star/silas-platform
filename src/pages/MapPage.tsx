import React, { useState } from 'react';
import { PinCard, usePins } from '@/modules/pins';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Filter, Search, Menu, X } from 'lucide-react';
import InteractiveMap from '@/components/InteractiveMap';
import SilasHeader from '@/components/SilasHeader';

const MapPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);

  const { pins, loading, error } = usePins({
    category_id: selectedCategory === 'all' ? undefined : selectedCategory
  });

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
      <SilasHeader />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className={`${showSidebar ? 'w-80' : 'w-0'} transition-all duration-300 bg-white shadow-lg flex flex-col overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">Community Pins</h1>
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
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C764C] mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading pins...</p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <p className="text-red-500">Error loading pins: {error}</p>
              </div>
            )}

            {!loading && !error && filteredPins.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No pins found</p>
                <p className="text-sm text-gray-400 mt-2">Click on the map to create a new pin</p>
              </div>
            )}

            <div className="space-y-4">
              {filteredPins.map((pin) => (
                <PinCard
                  key={pin.id}
                  pin={pin}
                  compact
                  onClick={(pin) => {
                    console.log('Selected pin:', pin);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <InteractiveMap className="w-full h-full" />

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
