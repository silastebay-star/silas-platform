import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Plus, Layers, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePins } from '@/modules/pins';
import { PinCard } from '@/modules/pins';
import EnhancedPinCreation from './EnhancedPinCreation';
import SilasPinDetail from './SilasPinDetail';
import { SILAS_BRANDING } from '@/styles/silasBranding';

// Mapbox access token - you'll need to set this in your environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjazZqb2V4YWowMDAwM29wbnZ0dHk3bWNuIn0.example';

interface InteractiveMapProps {
  className?: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ className = '' }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [showPinCreation, setShowPinCreation] = useState(false);
  const [showPinDetail, setShowPinDetail] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Get pins data
  const { pins, loading, error } = usePins({
    category_id: selectedCategory === 'all' ? undefined : selectedCategory
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

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
      
      // Add click handler for creating new pins
      map.current?.on('click', (e) => {
        setNewPinLocation({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        setShowPinCreation(true);
      });
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

    // Remove existing pin markers
    const existingMarkers = document.querySelectorAll('.pin-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new pin markers
    pins.forEach((pin) => {
      if (!pin.coordinates) return;

      // Create custom marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'pin-marker';
      markerElement.style.cssText = `
        width: 30px;
        height: 30px;
        background-color: ${pin.category?.color || SILAS_BRANDING.colors.primary};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
      `;

      // Add icon
      const icon = document.createElement('div');
      icon.innerHTML = '📍';
      icon.style.fontSize = '16px';
      markerElement.appendChild(icon);

      // Add hover effect
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // Add click handler
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPin(pin);
        setShowPinDetail(true);
      });

      // Create marker and add to map
      new mapboxgl.Marker(markerElement)
        .setLngLat([pin.coordinates.longitude, pin.coordinates.latitude])
        .addTo(map.current!);
    });
  }, [pins, mapLoaded]);

  const categories = [
    { id: 'all', name: 'All', color: SILAS_BRANDING.colors.primary },
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
    <div className={`relative w-full h-full ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        {/* Search */}
        <div className="bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search pins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus:ring-0 w-64"
          />
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div className="flex flex-wrap gap-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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
      </div>

      {/* Pin Count */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg px-3 py-2">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{filteredPins.length} pins</span>
          </div>
        </div>
      </div>

      {/* Add Pin Button */}
      <div className="absolute bottom-6 right-6 z-10">
        <Button
          onClick={() => setShowPinCreation(true)}
          className="rounded-full w-14 h-14 shadow-lg"
          style={{ backgroundColor: SILAS_BRANDING.colors.primary }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span>Loading pins...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-20 left-4 z-10">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading pins: {error}
          </div>
        </div>
      )}

      {/* Pin Creation Modal */}
      {showPinCreation && (
        <EnhancedPinCreation
          isOpen={showPinCreation}
          onClose={() => {
            setShowPinCreation(false);
            setNewPinLocation(null);
          }}
          initialLocation={newPinLocation}
        />
      )}

      {/* Pin Detail Modal */}
      {showPinDetail && selectedPin && (
        <SilasPinDetail
          pin={selectedPin}
          isOpen={showPinDetail}
          onClose={() => {
            setShowPinDetail(false);
            setSelectedPin(null);
          }}
        />
      )}
    </div>
  );
};

export default InteractiveMap;
