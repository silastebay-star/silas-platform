import React, { useState, useEffect } from 'react';
import { X, MapPin, Camera, Navigation, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import MobilePhotoUpload from './MobilePhotoUpload.jsx';
import { useMobileLocation } from '../hooks/useMobileLocation.js';

const QuickPinModal = ({ isOpen, onClose, onSubmit }) => {
  const [quickData, setQuickData] = useState({
    name: '',
    description: '',
    category: 'Economy',
    priority: 'normal',
    useCurrentLocation: true,
    coordinates: null,
    photos: []
  });
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // Use mobile location hook
  const {
    location,
    error: locationError,
    isLoading: isGettingLocation,
    accuracy,
    getCurrentLocation,
    requestPermission,
    permissionStatus,
    getAccuracyLevel
  } = useMobileLocation();

  // Get current location when modal opens
  useEffect(() => {
    if (isOpen && quickData.useCurrentLocation && !quickData.coordinates) {
      handleGetLocation();
    }
  }, [isOpen]);

  // Update coordinates when location changes
  useEffect(() => {
    if (location && quickData.useCurrentLocation) {
      setQuickData(prev => ({
        ...prev,
        coordinates: {
          lat: location.latitude,
          lng: location.longitude
        }
      }));
    }
  }, [location, quickData.useCurrentLocation]);

  const handleGetLocation = async () => {
    try {
      if (permissionStatus === 'denied') {
        setLocationError('Location access denied. Please enable in browser settings.');
        return;
      }

      await getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      });
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const handlePhotoUpload = (photos) => {
    setQuickData(prev => ({
      ...prev,
      photos: photos
    }));
    setShowPhotoUpload(false);
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
        photos: quickData.photos,
        accuracy: accuracy,
        accuracyLevel: getAccuracyLevel(),
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
      coordinates: null,
      photos: []
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
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Getting your location...</span>
                    </div>
                  )}

                  {locationError && (
                    <div className="text-sm text-red-600">
                      {locationError}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleGetLocation}
                        className="p-0 h-auto ml-2"
                      >
                        Try again
                      </Button>
                    </div>
                  )}

                  {quickData.coordinates && !isGettingLocation && (
                    <div className="text-sm text-green-600">
                      ✓ Location acquired ({quickData.coordinates.lat.toFixed(6)}, {quickData.coordinates.lng.toFixed(6)})
                      {accuracy && (
                        <div className="text-xs text-gray-500 mt-1">
                          Accuracy: {Math.round(accuracy)}m ({getAccuracyLevel()})
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPhotoUpload(true)}
            >
              <Camera className="h-4 w-4 mr-2" />
              Add Photos {quickData.photos.length > 0 && `(${quickData.photos.length})`}
            </Button>

            {quickData.photos.length > 0 && (
              <div className="mt-2 flex space-x-2 overflow-x-auto">
                {quickData.photos.slice(0, 3).map((photo, index) => (
                  <div key={index} className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {quickData.photos.length > 3 && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                    +{quickData.photos.length - 3}
                  </div>
                )}
              </div>
            )}
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

      {/* Mobile Photo Upload Modal */}
      <MobilePhotoUpload
        isOpen={showPhotoUpload}
        onCancel={() => setShowPhotoUpload(false)}
        onPhotoUpload={handlePhotoUpload}
        maxPhotos={5}
        existingPhotos={quickData.photos}
      />
    </div>
  );
};

export default QuickPinModal;
