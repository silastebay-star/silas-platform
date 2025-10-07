import React, { useState, useEffect } from 'react';
import { PinCard, usePins } from '@/modules/pins';
import { Button } from '@/core/components/Button';
import { Modal } from '@/core/components/Modal';
import { Plus, Filter, Search } from 'lucide-react';

const MapPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Community Map</h1>
            <Button
              size="sm"
              onClick={() => setShowCreatePin(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Pin
            </Button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search pins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4C764C] focus:border-transparent"
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
              <Button
                className="mt-4"
                onClick={() => setShowCreatePin(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create First Pin
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {filteredPins.map((pin) => (
              <PinCard
                key={pin.id}
                pin={pin}
                compact
                onClick={(pin) => {
                  // Handle pin selection - could open detail modal or focus on map
                  console.log('Selected pin:', pin);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#4C764C] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Interactive Map</h3>
            <p className="text-gray-500 mb-4">
              Map integration will be implemented here
            </p>
            <p className="text-sm text-gray-400">
              Showing {filteredPins.length} pins in {selectedCategory === 'all' ? 'all categories' : categories.find(c => c.id === selectedCategory)?.name}
            </p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white"
            leftIcon={<Filter className="w-4 h-4" />}
          >
            Filters
          </Button>
        </div>
      </div>

      {/* Create Pin Modal */}
      <Modal
        isOpen={showCreatePin}
        onClose={() => setShowCreatePin(false)}
        title="Create New Pin"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pin Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4C764C] focus:border-transparent"
              placeholder="Enter pin name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4C764C] focus:border-transparent"
              placeholder="Describe this community pin..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4C764C] focus:border-transparent">
              {categories.slice(1).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreatePin(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setShowCreatePin(false)}>
              Create Pin
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MapPage;
