import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Camera, Navigation, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobilePinDropper = ({ 
  onPinDrop, 
  onCancel, 
  isActive, 
  mapRef,
  LAYER_CONFIG 
}) => {
  const [isDropping, setIsDropping] = useState(false);
  const [dropPosition, setDropPosition] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const longPressTimer = useRef(null);
  const longPressStarted = useRef(false);
  const touchStartPos = useRef(null);

  // Mobile touch handlers for long press
  const handleTouchStart = (e) => {
    if (!isActive) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressStarted.current = true;

    // Start long press timer (800ms for mobile)
    longPressTimer.current = setTimeout(() => {
      if (longPressStarted.current) {
        handleLongPress(e);
      }
    }, 800);
  };

  const handleTouchMove = (e) => {
    if (!longPressStarted.current || !touchStartPos.current) return;

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
    const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

    // Cancel long press if finger moves too much (10px threshold)
    if (deltaX > 10 || deltaY > 10) {
      cancelLongPress();
    }
  };

  const handleTouchEnd = () => {
    cancelLongPress();
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressStarted.current = false;
    touchStartPos.current = null;
  };

  const handleLongPress = (e) => {
    if (!mapRef?.current) return;

    // Get map container bounds
    const mapContainer = mapRef.current.getContainer();
    const rect = mapContainer.getBoundingClientRect();
    
    // Calculate position relative to map
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Convert pixel coordinates to lat/lng
    const lngLat = mapRef.current.unproject([x, y]);
    
    setDropPosition({
      lat: lngLat.lat,
      lng: lngLat.lng,
      x: x,
      y: y
    });
    
    setIsDropping(true);
    setShowConfirmation(true);

    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    cancelLongPress();
  };

  const confirmPinDrop = () => {
    if (dropPosition && onPinDrop) {
      onPinDrop({
        lat: dropPosition.lat,
        lng: dropPosition.lng
      });
    }
    resetState();
  };

  const cancelPinDrop = () => {
    resetState();
    if (onCancel) onCancel();
  };

  const resetState = () => {
    setIsDropping(false);
    setDropPosition(null);
    setShowConfirmation(false);
    cancelLongPress();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelLongPress();
    };
  }, []);

  // Reset when not active
  useEffect(() => {
    if (!isActive) {
      resetState();
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* Touch overlay for capturing long press */}
      <div
        className="absolute inset-0 z-30 touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          background: 'transparent',
          cursor: 'crosshair'
        }}
      />

      {/* Instructions overlay */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium">
        📍 Press and hold to drop a pin
      </div>

      {/* Pin drop indicator */}
      {isDropping && dropPosition && (
        <div
          className="absolute z-40 pointer-events-none"
          style={{
            left: dropPosition.x - 12,
            top: dropPosition.y - 24,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="relative">
            {/* Animated pin */}
            <MapPin 
              className="h-6 w-6 text-red-500 animate-bounce" 
              fill="currentColor"
            />
            {/* Ripple effect */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-red-500/30 rounded-full animate-ping"></div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirmation && dropPosition && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="bg-white rounded-t-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Drop Pin Here?
              </h3>
              <p className="text-sm text-gray-600">
                Create a new pin at this location
              </p>
              <div className="text-xs text-gray-500 mt-2 font-mono">
                {dropPosition.lat.toFixed(6)}, {dropPosition.lng.toFixed(6)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={cancelPinDrop}
                className="flex items-center justify-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={confirmPinDrop}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Check className="h-4 w-4" />
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobilePinDropper;
