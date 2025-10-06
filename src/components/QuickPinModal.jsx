import React, { useState, useEffect } from 'react';
import { X, MapPin, Camera, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const QuickPinModal = ({ isOpen, onClose, onSubmit }) => {
  const [quickData, setQuickData] = useState({
    name: '',
    description: '',
    category: 'Economy',
    priority: 'normal',
    useCurrentLocation: true,
    coordinates: null
  });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Get current location when modal opens
  useEffect(() => {
    if (isOpen && quickData.useCurrentLocation && !quickData.coordinates) {
      getCurrentLocation();
    }
  }, [isOpen]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setQuickData(prev => ({
          ...prev,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location services.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSubmit = () => {
    if (!quickData.name.trim()) {
      alert('Please enter a name for the pin');
      return;
    }

    if (!quickData.coordinates) {
      alert('Location is required. Please enable location services or enter coordinates manually.');
      return;
    }

    onSubmit({
      ...quickData,
      coords: quickData.coordinates,
      metadata: {
        quickPin: true,
        priority: quickData.priority,
        createdAt: new Date().toISOString()
      }
    });

    // Reset form
    setQuickData({
      name: '',
      description: '',
      category: 'Economy',
      priority: 'normal',
      useCurrentLocation: true,
      coordinates: null
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:items-center">
      <Card className="w-full max-w-md mx-4 mb-4 bg-white md:mb-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Quick Pin</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Pin Name *</label>
            <Input
              value={quickData.name}
              onChange={(e) => setQuickData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="What's happening here?"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={quickData.description}
              onChange={(e) => setQuickData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add more details..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={quickData.category}
              onChange={(e) => setQuickData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Economy">Economy</option>
              <option value="Faith">Faith</option>
              <option value="Works">Works</option>
              <option value="Circle">Circle</option>
              <option value="Mind">Mind</option>
              <option value="Pulse">Pulse</option>
              <option value="Commerce">Commerce</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={quickData.priority}
              onChange={(e) => setQuickData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="useCurrentLocation"
                  checked={quickData.useCurrentLocation}
                  onChange={(e) => setQuickData(prev => ({ ...prev, useCurrentLocation: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="useCurrentLocation" className="text-sm text-gray-700">
                  Use my current location
                </label>
              </div>

              {quickData.useCurrentLocation && (
                <div className="bg-gray-50 p-3 rounded-md">
                  {isGettingLocation && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Navigation className="h-4 w-4 animate-spin" />
                      <span>Getting your location...</span>
                    </div>
                  )}
                  
                  {locationError && (
                    <div className="text-sm text-red-600">
                      {locationError}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={getCurrentLocation}
                        className="p-0 h-auto ml-2"
                      >
                        Try again
                      </Button>
                    </div>
                  )}
                  
                  {quickData.coordinates && !isGettingLocation && (
                    <div className="text-sm text-green-600">
                      ✓ Location acquired ({quickData.coordinates.lat.toFixed(6)}, {quickData.coordinates.lng.toFixed(6)})
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Photo placeholder */}
          <div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                // TODO: Implement photo capture
                alert('Photo capture coming soon!');
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Add Photo (Coming Soon)
            </Button>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={!quickData.name.trim() || (!quickData.coordinates && quickData.useCurrentLocation)}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Create Pin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickPinModal;
