import React, { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { usePinsStore, type Pin } from '@/store/pins';
import { MapPin, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PinDetail from './PinDetail';
import AddPinModal from './AddPinModal';

// Pin type colors
const PIN_COLORS = {
  project: '#4C764C',
  business: '#10B981', 
  event: '#F59E0B',
  issue: '#EF4444',
  environment: '#059669',
  faith: '#8B5CF6',
  community: '#EC4899'
};

interface MapRootProps {
  className?: string;
}

const MapRoot: React.FC<MapRootProps> = ({ className = '' }) => {
  const {
    pins,
    selectedPin,
    setSelectedPin,
    addPin,
    fetchPins,
    isLoading,
    error
  } = usePinsStore();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showPinDetail, setShowPinDetail] = useState(false);

  // Fetch pins on mount
  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken) {
      console.warn('Mapbox token not found, using fallback map');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-2.3769, 53.5526], // Stoneclough coordinates
      zoom: 14,
      pitch: 0,
      bearing: 0
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Add right-click handler for creating pins
    map.current.on('contextmenu', (e) => {
      e.preventDefault();
      setNewPinLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      setShowAddModal(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add pins to map
  useEffect(() => {
    if (!map.current || !mapLoaded || !pins.length) return;

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.pin-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new markers
    pins.forEach((pin) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'pin-marker';
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${PIN_COLORS[pin.type] || PIN_COLORS.community};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
      `;

      const icon = document.createElement('div');
      icon.innerHTML = '📍';
      icon.style.fontSize = '16px';
      markerElement.appendChild(icon);

      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      markerElement.addEventListener('click', () => {
        setSelectedPin(pin);
        setShowPinDetail(true);
      });

      new mapboxgl.Marker(markerElement)
        .setLngLat([pin.lng, pin.lat])
        .addTo(map.current!);
    });
  }, [pins, mapLoaded, setSelectedPin]);

  // Handle add pin
  const handleAddPin = async (pinData: any) => {
    if (!newPinLocation) return;

    const newPin = await addPin({
      ...pinData,
      lat: newPinLocation.lat,
      lng: newPinLocation.lng
    });

    if (newPin) {
      setShowAddModal(false);
      setNewPinLocation(null);
    }
  };

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center p-8">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Mapbox Token Required
          </h3>
          <p className="text-gray-500">
            Please add your Mapbox access token to .env.local
          </p>
          <code className="block mt-2 p-2 bg-gray-200 rounded text-sm">
            VITE_MAPBOX_ACCESS_TOKEN=your_token_here
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4C764C]"></div>
            <span className="text-sm text-gray-600">Loading pins...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Pin Count */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg px-3 py-2">
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="w-4 h-4 text-[#4C764C]" />
          <span className="font-medium">{pins.length} pins</span>
        </div>
      </div>

      {/* Add Pin Instructions */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-3 max-w-xs">
        <div className="flex items-start space-x-2">
          <Plus className="w-5 h-5 text-[#4C764C] mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Add a Pin</p>
            <p className="text-xs text-gray-600">Right-click anywhere on the map</p>
          </div>
        </div>
      </div>

      {/* Add Pin Modal */}
      <AddPinModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewPinLocation(null);
        }}
        onSubmit={handleAddPin}
        location={newPinLocation}
      />

      {/* Pin Detail Modal */}
      {selectedPin && (
        <PinDetail
          pin={selectedPin}
          isOpen={showPinDetail}
          onClose={() => setShowPinDetail(false)}
        />
      )}
    </div>
  );
};

export default MapRoot;
