import React, { useState } from 'react';
import { MapPin, Camera, Navigation, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MobileContextMenu = ({ 
  isVisible, 
  position, 
  onClose, 
  onQuickPin, 
  onPinDrop, 
  onPhotoPin,
  LAYER_CONFIG 
}) => {
  const [showLayerSelect, setShowLayerSelect] = useState(false);

  if (!isVisible || !position) return null;

  const handleLayerSelect = (layer) => {
    onPinDrop(position, layer);
    setShowLayerSelect(false);
    onClose();
  };

  const getLayerColor = (layer) => {
    return LAYER_CONFIG[layer]?.color || '#6B7280';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Context Menu */}
      <div 
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        style={{
          left: Math.min(position.x - 100, window.innerWidth - 220),
          top: Math.min(position.y - 50, window.innerHeight - 300),
          minWidth: '200px'
        }}
      >
        {!showLayerSelect ? (
          // Main Menu
          <div className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2 border-b border-gray-100">
              Create Pin Here
            </div>
            
            <div className="space-y-1 mt-2">
              {/* Quick Pin */}
              <button
                onClick={() => {
                  onQuickPin(position);
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3 py-3 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Quick Pin</div>
                  <div className="text-xs text-gray-500">Fast pin with current location</div>
                </div>
              </button>

              {/* Photo Pin */}
              <button
                onClick={() => {
                  onPhotoPin(position);
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3 py-3 hover:bg-green-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Camera className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Photo Pin</div>
                  <div className="text-xs text-gray-500">Pin with camera capture</div>
                </div>
              </button>

              {/* Custom Pin */}
              <button
                onClick={() => setShowLayerSelect(true)}
                className="w-full flex items-center space-x-3 px-3 py-3 hover:bg-purple-50 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">Custom Pin</div>
                  <div className="text-xs text-gray-500">Choose category and details</div>
                </div>
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
                <span className="text-sm">Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          // Layer Selection
          <div className="p-2">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <div className="text-xs text-gray-500">Choose Category</div>
              <button
                onClick={() => setShowLayerSelect(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-1 mt-2 max-h-64 overflow-y-auto">
              {Object.keys(LAYER_CONFIG).filter(layer => layer !== "All").map((layer) => (
                <button
                  key={layer}
                  onClick={() => handleLayerSelect(layer)}
                  className="w-full flex items-center space-x-3 px-3 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${getLayerColor(layer)}20` }}
                  >
                    {LAYER_CONFIG[layer].icon && 
                      React.createElement(LAYER_CONFIG[layer].icon, { 
                        size: 14, 
                        style: { color: getLayerColor(layer) } 
                      })
                    }
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">{layer}</div>
                    <div className="text-xs text-gray-500">
                      {LAYER_CONFIG[layer].description || `Create a ${layer.toLowerCase()} pin`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileContextMenu;
