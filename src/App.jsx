import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import Papa from "papaparse";
import * as toGeoJSON from "@mapbox/togeojson";
import * as turf from "@turf/turf";
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { X, MapPin, MessageCircle, ThumbsUp, Users, TrendingUp, Lightbulb, Briefcase, Church, Hammer, Database } from 'lucide-react';
import { supabaseHelpers } from './lib/supabase.js';
import { CopilotModal } from './components/CopilotModal.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import silasLogo from './assets/silas-logo.png';
import { censusData, getDemographicComparison, getCommunityInsights, formatPercentage, formatPopulation } from './utils/censusData.js';
import './App.css';

// Mapbox configuration with correct token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ||
                     process.env.VITE_MAPBOX_TOKEN ||
                     "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdmOXhmMW4wNHplMmxzY2Rzd2lkcWt3In0.0AHptZ2vtFbg8ejWKN2l1w";

// Census data integration is properly imported and ready for use
// Build timestamp: 2025-01-06 21:15 UTC - Import fix applied

const MAPBOX_STYLE = import.meta.env.VITE_MAPBOX_STYLE ||
                     process.env.VITE_MAPBOX_STYLE ||
                     "mapbox://styles/silastebay/cmgff34w9000v01pebcy24k4l";

// Debug logging for production
if (typeof window !== 'undefined') {
  console.log('Mapbox Token Available:', MAPBOX_TOKEN ? 'Yes' : 'No');
  console.log('Mapbox Style:', MAPBOX_STYLE);
}

const LAYER_CONFIG = {
  All: { color: "#4c764c", id: "all", icon: MapPin },
  Economy: { color: "#4c764c", id: "economy", icon: Briefcase },
  Faith: { color: "#d2a24c", id: "faith", icon: Church },
  Works: { color: "#3c82b3", id: "works", icon: Hammer },
  Pulse: { color: "#6c4c76", id: "pulse", icon: TrendingUp },
  Mind: { color: "#6e7a72", id: "mind", icon: Lightbulb },
  Circle: { color: "#b35c8a", id: "circle", icon: Users },
  Commerce: { color: "#2f7a4a", id: "commerce", icon: Briefcase },
};

// MapboxCentral Component now accepts GeoJSON data directly
function MapboxCentral({ mapData, kmlUrl, onSelect, mapApiRef, activeLayer, onRightClick, boundsWarning, setBoundsWarning }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const boundaryPolygonRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }, []);

  const isPointInBoundary = (lngLat) => {
    if (!boundaryPolygonRef.current) return true;
    const point = turf.point([lngLat.lng, lngLat.lat]);
    return turf.booleanPointInPolygon(point, boundaryPolygonRef.current);
  };

  const showBoundsWarning = (lngLat) => {
    setBoundsWarning({ lngLat, timestamp: Date.now() });
    setTimeout(() => setBoundsWarning(null), 4000);

    const map = mapRef.current;
    if (!map) return;

    const sourceId = `invalid-click-${Date.now()}`;
    const layerId = `invalid-click-layer-${Date.now()}`;

    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'Point', coordinates: [lngLat.lng, lngLat.lat] }
    });
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 15,
        'circle-color': '#f44336',
        'circle-opacity': 0.7,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#fff',
      }
    });

    // Add pulsing animation
    let opacity = 0.7;
    let growing = false;
    const animate = () => {
      if (!map.getLayer(layerId)) return;

      opacity += growing ? 0.05 : -0.05;
      if (opacity >= 0.9) growing = false;
      if (opacity <= 0.3) growing = true;

      map.setPaintProperty(layerId, 'circle-opacity', opacity);
      requestAnimationFrame(animate);
    };
    animate();

    setTimeout(() => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    }, 3000);
  };

  const updateMapTheming = (layer) => {
    const map = mapRef.current;
    if (!map) return;

    const layerColor = LAYER_CONFIG[layer]?.color || LAYER_CONFIG.Economy.color;

    // Update cluster colors
    if (map.getLayer("clusters")) {
      map.setPaintProperty("clusters", "circle-color", layerColor);
    }

    // Update unclustered point colors
    if (map.getLayer("unclustered-point")) {
      map.setPaintProperty("unclustered-point", "circle-color", layerColor);
    }

    // Update boundary line color
    if (map.getLayer("boundary-line")) {
      map.setPaintProperty("boundary-line", "line-color", layerColor);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [-2.3769, 53.5526],
      zoom: 13,
    });

    if (mapApiRef) {
      mapApiRef.current = {
        flyToCoords: (lngLat, zoom = 15) => map.flyTo({ center: lngLat, zoom }),
        fitToBounds: (bounds) => map.fitBounds(bounds),
      };
    }

    const loadBoundaryAndData = async () => {
      // 1) Load KML boundary
      try {
        const kmlResp = await fetch(kmlUrl);
        const kmlText = await kmlResp.text();
        const kmlDom = new DOMParser().parseFromString(kmlText, "application/xml");
        const boundaryGeoJSON = toGeoJSON.kml(kmlDom);
        
        if (boundaryGeoJSON && boundaryGeoJSON.features && boundaryGeoJSON.features.length) {
          const poly = boundaryGeoJSON.features.find((f) => 
            f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
          );
          boundaryPolygonRef.current = poly || boundaryGeoJSON.features[0];
          const bounds = turf.bbox(boundaryPolygonRef.current);
          const pad = 0.001;
          map.fitBounds(
            [[bounds[0] - pad, bounds[1] - pad], [bounds[2] + pad, bounds[3] + pad]], 
            { padding: 40 }
          );
          map.setMaxBounds([
            [bounds[0] - 0.02, bounds[1] - 0.02], 
            [bounds[2] + 0.02, bounds[3] + 0.02]
          ]);

          if (!map.getSource("communityBoundary")) {
            map.addSource("communityBoundary", { type: "geojson", data: boundaryPolygonRef.current });
            map.addLayer({ id: "boundary-fill", type: "fill", source: "communityBoundary", paint: { "fill-color": "#ffffff", "fill-opacity": 0 } });
            map.addLayer({ id: "boundary-line", type: "line", source: "communityBoundary", paint: { "line-color": "#4c764c", "line-width": 3 } });
          }
        }
      } catch (err) {
        console.warn("Failed to load/parse KML boundary:", err);
      }

      // 2) Load map data (now passed as a prop)
      if (!map.getSource("communityData")) {
        map.addSource("communityData", { 
          type: "geojson", 
          data: mapData, 
          cluster: true, 
          clusterRadius: 50 
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "communityData",
          filter: ["has", "point_count"],
          paint: { "circle-color": LAYER_CONFIG.Economy.color, "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25], "circle-opacity": 0.9 },
        });

        map.addLayer({ id: "cluster-count", type: "symbol", source: "communityData", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12 } });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "communityData",
          filter: ["!has", "point_count"],
          paint: { "circle-color": LAYER_CONFIG.Economy.color, "circle-radius": 8, "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
        });
      } else {
        map.getSource("communityData").setData(mapData);
      }

      // Click interactions
      map.on("click", "unclustered-point", (e) => onSelect(e.features?.[0]));
      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource("communityData").getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom });
        });
      });

      map.on("mouseenter", ["unclustered-point", "clusters"], () => map.getCanvas().style.cursor = "pointer");
      map.on("mouseleave", ["unclustered-point", "clusters"], () => map.getCanvas().style.cursor = "");

      map.on("contextmenu", (e) => {
        e.preventDefault();
        if (isPointInBoundary(e.lngLat)) {
          setContextMenu({ x: e.point.x, y: e.point.y, lngLat: e.lngLat });
        } else {
          showBoundsWarning(e.lngLat);
        }
      });

      map.on("click", () => setContextMenu(null));
    };

    map.on("load", loadBoundaryAndData);

    mapRef.current = map;
    return () => map.remove();
  }, []); // Only run once on initial mount

  // Update data source when mapData prop changes
  useEffect(() => {
    const map = mapRef.current;
    if (map && map.getSource('communityData') && map.isSourceLoaded('communityData')) {
      map.getSource('communityData').setData(mapData);
    }
  }, [mapData]);

  // React to activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !map.getLayer("unclustered-point")) return;

    const layerColor = activeLayer ? LAYER_CONFIG[activeLayer]?.color : LAYER_CONFIG.Economy.color;

    // Create a data-driven color expression for the 'All' view
    const layerColors = Object.entries(LAYER_CONFIG)
      .filter(([key]) => key !== 'All')
      .flatMap(([key, val]) => [key, val.color]);
    
    const colorExpression = [
      'match',
      ['get', 'layer'],
      ...layerColors,
      LAYER_CONFIG.Economy.color // Default color
    ];

    const pointColor = activeLayer === 'All' ? colorExpression : layerColor;

    // Create dynamic sizing based on active layer
    const sizeExpression = activeLayer === 'All'
      ? 8 // Default size when viewing all layers
      : [
          'case',
          ['==', ['get', 'layer'], activeLayer],
          12, // Larger size for active layer pins
          6   // Smaller size for inactive layer pins
        ];

    // Update paint properties
    if (map.getLayer("clusters")) {
      map.setPaintProperty("clusters", "circle-color", activeLayer === 'All' ? LAYER_CONFIG.All.color : layerColor);
      // Make clusters for active layer larger too
      const clusterSize = activeLayer === 'All'
        ? ["step", ["get", "point_count"], 15, 10, 20, 30, 25]
        : ["step", ["get", "point_count"], 18, 10, 24, 30, 30];
      map.setPaintProperty("clusters", "circle-radius", clusterSize);
    }

    if (map.getLayer("unclustered-point")) {
      map.setPaintProperty("unclustered-point", "circle-color", pointColor);
      map.setPaintProperty("unclustered-point", "circle-radius", sizeExpression);
      // Add subtle glow effect for active layer pins
      const strokeWidth = activeLayer === 'All' ? 2 : [
        'case',
        ['==', ['get', 'layer'], activeLayer],
        3, // Thicker stroke for active layer
        1  // Thinner stroke for inactive layers
      ];
      map.setPaintProperty("unclustered-point", "circle-stroke-width", strokeWidth);
    }

    // Set filter
    const filter = activeLayer && activeLayer !== 'All' ? ["==", ["get", "layer"], activeLayer] : null;
    
    try {
      if (map.getLayer("unclustered-point")) map.setFilter("unclustered-point", filter);
      if (map.getLayer("cluster-count")) map.setFilter("cluster-count", filter ? ["!=", ["get", "layer"], ""] : null);
      if (map.getLayer("clusters")) map.setFilter("clusters", filter ? ["==", ["get", "layer"], activeLayer] : null);
    } catch (e) {
      console.warn("Filter error:", e);
    }
  }, [activeLayer, mapData]);

  // Update theming when active layer changes
  useEffect(() => {
    updateMapTheming(activeLayer);
  }, [activeLayer]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="absolute inset-0 z-0" />
      
      {contextMenu && (
        <div 
          className="absolute z-50 bg-white rounded-lg shadow-xl border py-2 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="px-3 py-1 text-xs text-gray-500 border-b mb-1">Create New Pin</div>
          {Object.keys(LAYER_CONFIG).filter(layer => layer !== "All").map((layer) => (
            <button
              key={layer}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
              onClick={() => {
                onRightClick?.(contextMenu.lngLat, layer);
                setContextMenu(null);
              }}
            >
              {React.createElement(LAYER_CONFIG[layer].icon, { size: 16, style: { color: LAYER_CONFIG[layer].color } })}
              {layer}
            </button>
          ))}
        </div>
      )}
      
      {boundsWarning && (
        <div className="absolute z-40 top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="text-sm font-medium">Cannot create pins outside community boundary</div>
        </div>
      )}
    </div>
  );
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function PinCreationForm({ layer, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: layer,
    tags: '',
    // Layer-specific fields
    schedule: '',
    contact: '',
    progress: 0,
    deadline: '',
    resources: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error creating pin:', error);
    }
    setIsSubmitting(false);
  };

  const placeholders = {
    Faith: { name: 'Church or Event Name', description: 'Service times, community activities, spiritual gatherings...' },
    Economy: { name: 'Business Name', description: 'Services offered, opening hours, contact information...' },
    Commerce: { name: 'Business Name', description: 'Products/services, hours, special offers...' },
    Works: { name: 'Project Name', description: 'Goals, volunteer opportunities, expected outcomes...' },
    Circle: { name: 'Proposal Title', description: 'What needs to be discussed, voted on, or decided...' },
    Mind: { name: 'Learning Resource', description: 'Educational content, skills offered, learning objectives...' },
    Pulse: { name: 'Data Point', description: 'KPI or metric being tracked, measurement details...' },
  }[layer] || { name: 'Name', description: 'Description...' };

  const layerSpecificFields = {
    Faith: ['schedule', 'contact'],
    Economy: ['contact', 'schedule'],
    Commerce: ['contact', 'schedule'],
    Works: ['deadline', 'resources'],
    Circle: ['deadline'],
    Mind: ['contact'],
    Pulse: []
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={placeholders.name}
          required
          className="focus:ring-2"
          style={{ '--tw-ring-color': LAYER_CONFIG[layer]?.color }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md resize-none h-20 text-sm focus:ring-2 focus:border-transparent"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={placeholders.description}
          style={{ '--tw-ring-color': LAYER_CONFIG[layer]?.color }}
        />
      </div>

      {/* Layer-specific fields */}
      {layerSpecificFields[layer]?.includes('schedule') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Schedule/Hours</label>
          <Input
            value={formData.schedule}
            onChange={(e) => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
            placeholder="e.g., Mon-Fri 9AM-5PM, Sundays 10AM service"
          />
        </div>
      )}

      {layerSpecificFields[layer]?.includes('contact') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
          <Input
            value={formData.contact}
            onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
            placeholder="Phone, email, or website"
          />
        </div>
      )}

      {layerSpecificFields[layer]?.includes('deadline') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deadline/Timeline</label>
          <Input
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            placeholder="When does this need to be completed?"
          />
        </div>
      )}

      {layerSpecificFields[layer]?.includes('resources') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resources Needed</label>
          <Input
            value={formData.resources}
            onChange={(e) => setFormData(prev => ({ ...prev, resources: e.target.value }))}
            placeholder="Materials, volunteers, funding needed"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (optional)</label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="community, local, volunteer, urgent"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          className="flex-1"
          style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Pin'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function DataInspector({ feature, onClose }) {
  const [realData, setRealData] = useState({
    vitality: 75,
    totalPins: 5,
    recentActivity: 3,
    engagement: [12, 15, 18, 14, 16, 20, 17],
    participation: [8, 10, 12, 9, 11, 14, 13]
  });
  const [loading, setLoading] = useState(false);

  return (
    <Card className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[500px] bg-white/98 backdrop-blur-md shadow-2xl border-2 animate-in fade-in zoom-in-95 duration-300" style={{ borderColor: LAYER_CONFIG.Pulse.color }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: LAYER_CONFIG.Pulse.color }}>
            <TrendingUp size={20} />
            Data Inspector: {feature.properties?.name}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2" style={{ color: LAYER_CONFIG.Pulse.color }}>Key Metrics</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Pulse.color }}>{loading ? '...' : `${realData?.vitality || 0}%`}</div>
                <div className="text-xs text-gray-600">Community Vitality</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Pulse.color }}>{loading ? '...' : realData?.totalPins || 0}</div>
                <div className="text-xs text-gray-600">Total Pins</div>
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Pulse.color }}>{loading ? '...' : realData?.recentActivity || 0}</div>
                <div className="text-xs text-gray-600">Recent Activity</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2" style={{ color: LAYER_CONFIG.Pulse.color }}>Trend Analysis</h4>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">📈 Engagement: {loading ? 'Loading...' : `${realData?.engagement?.reduce((a, b) => a + b, 0) || 0} total interactions`}</div>
              <div className="text-sm text-gray-600">👥 Participation: {loading ? 'Loading...' : `${realData?.participation?.reduce((a, b) => a + b, 0) || 0} community comments`}</div>
              <div className="text-sm text-gray-600">🌱 Growth: {loading ? 'Loading...' : `${realData?.recentActivity || 0} new activities this week`}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" style={{ backgroundColor: LAYER_CONFIG.Pulse.color }}>Generate Report</Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Economy Layer Tools
function BusinessDirectory({ layer, onClose }) {
  const [businesses, setBusinesses] = useState([
    { id: 1, name: "Stoneclough Bakery", category: "Food & Dining", rating: 4.8, contact: "01234 567890", status: "Open" },
    { id: 2, name: "Green Valley Farm", category: "Agriculture", rating: 4.9, contact: "01234 567891", status: "Open" },
    { id: 3, name: "Local Crafts Co.", category: "Retail", rating: 4.6, contact: "01234 567892", status: "Open" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Business Directory</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xs">Search</Button>
        <Button className="text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          List Business
        </Button>
      </div>

      <div className="space-y-3">
        {businesses.map(business => (
          <Card key={business.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{business.name}</h4>
                  <p className="text-sm text-gray-600">{business.category}</p>
                  <p className="text-xs text-gray-500">{business.contact}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium" style={{ color: LAYER_CONFIG[layer]?.color }}>
                    ⭐ {business.rating}
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    {business.status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs flex-1">Contact</Button>
                <Button size="sm" className="text-xs flex-1" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                  Support
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EconomicIndicators({ layer, onClose }) {
  const [indicators, setIndicators] = useState([
    { name: "Local Employment", value: "94.2%", change: "+2.1%", trend: "up" },
    { name: "Business Growth", value: "12", change: "+3", trend: "up" },
    { name: "Local Spending", value: "£2.4M", change: "+8.5%", trend: "up" },
    { name: "Property Values", value: "£185k", change: "+3.2%", trend: "up" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Economic Indicators</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {indicators.map((indicator, index) => (
          <Card key={index} className="p-3">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700">{indicator.name}</h4>
              <div className="text-lg font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                {indicator.value}
              </div>
              <div className={`text-xs flex items-center gap-1 ${
                indicator.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>{indicator.trend === 'up' ? '↗️' : '↘️'}</span>
                {indicator.change}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        View Detailed Report
      </Button>
    </div>
  );
}

function InvestmentOpportunities({ layer, onClose }) {
  const [opportunities, setOpportunities] = useState([
    { id: 1, title: "Community Solar Project", amount: "£50k", returns: "8.5% annually", risk: "Low", deadline: "30 days" },
    { id: 2, title: "Local Food Hub", amount: "£25k", returns: "12% annually", risk: "Medium", deadline: "45 days" },
    { id: 3, title: "Artisan Workshop Space", amount: "£15k", returns: "10% annually", risk: "Low", deadline: "60 days" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Investment Opportunities</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Submit Investment Proposal
      </Button>

      <div className="space-y-3">
        {opportunities.map(opportunity => (
          <Card key={opportunity.id} className="p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">{opportunity.title}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Amount: </span>
                  <span className="font-medium">{opportunity.amount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Returns: </span>
                  <span className="font-medium text-green-600">{opportunity.returns}</span>
                </div>
                <div>
                  <span className="text-gray-500">Risk: </span>
                  <span className={`font-medium ${
                    opportunity.risk === 'Low' ? 'text-green-600' :
                    opportunity.risk === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                  }`}>{opportunity.risk}</span>
                </div>
                <div>
                  <span className="text-gray-500">Deadline: </span>
                  <span className="font-medium">{opportunity.deadline}</span>
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                Learn More
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SkillsExchange({ layer, onClose }) {
  const [skills, setSkills] = useState([
    { id: 1, person: "Sarah M.", offering: "Web Design", seeking: "Gardening Help", rating: 4.9 },
    { id: 2, person: "John D.", offering: "Carpentry", seeking: "Accounting", rating: 4.7 },
    { id: 3, person: "Emma L.", offering: "Tutoring", seeking: "Car Maintenance", rating: 4.8 }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Skills Exchange</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xs">My Skills</Button>
        <Button className="text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          Add Skill
        </Button>
      </div>

      <div className="space-y-3">
        {skills.map(skill => (
          <Card key={skill.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{skill.person}</h4>
                <div className="text-sm" style={{ color: LAYER_CONFIG[layer]?.color }}>
                  ⭐ {skill.rating}
                </div>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">Offering:</span>
                  <span className="font-medium">{skill.offering}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">Seeking:</span>
                  <span className="font-medium">{skill.seeking}</span>
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                Connect
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Works Layer Tools
function ProjectTracker({ layer, onClose }) {
  const [projects, setProjects] = useState([
    { id: 1, name: "Community Garden Expansion", progress: 75, volunteers: 12, deadline: "March 2025", status: "On Track" },
    { id: 2, name: "Playground Renovation", progress: 45, volunteers: 8, deadline: "April 2025", status: "Needs Help" },
    { id: 3, name: "Village Hall Repairs", progress: 90, volunteers: 15, deadline: "February 2025", status: "Nearly Done" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Project Tracker</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Start New Project
      </Button>

      <div className="space-y-3">
        {projects.map(project => (
          <Card key={project.id} className="p-3">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-600">{project.volunteers} volunteers • Due {project.deadline}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  project.status === 'On Track' ? 'bg-green-100 text-green-800' :
                  project.status === 'Needs Help' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {project.status}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: LAYER_CONFIG[layer]?.color
                    }}
                  />
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                Join Project
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ResourceManager({ layer, onClose }) {
  const [resources, setResources] = useState([
    { id: 1, item: "Power Tools", available: 3, total: 5, location: "Community Center", contact: "John D." },
    { id: 2, item: "Garden Equipment", available: 7, total: 10, location: "Village Hall", contact: "Sarah M." },
    { id: 3, item: "Paint & Brushes", available: 0, total: 8, location: "Storage Shed", contact: "Mike R." }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Resource Manager</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xs">Request Resource</Button>
        <Button className="text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          Donate Resource
        </Button>
      </div>

      <div className="space-y-3">
        {resources.map(resource => (
          <Card key={resource.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{resource.item}</h4>
                  <p className="text-sm text-gray-600">{resource.location}</p>
                  <p className="text-xs text-gray-500">Contact: {resource.contact}</p>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    resource.available > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {resource.available}/{resource.total} available
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full text-xs"
                disabled={resource.available === 0}
                style={{ backgroundColor: resource.available > 0 ? LAYER_CONFIG[layer]?.color : '#gray' }}
              >
                {resource.available > 0 ? 'Reserve' : 'Out of Stock'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Circle (Governance) Layer Tools
function VotingSystem({ layer, onClose }) {
  const [proposals, setProposals] = useState([
    { id: 1, title: "New Community Center Hours", description: "Extend opening hours to 9 PM", votes: { yes: 45, no: 12 }, deadline: "5 days", status: "Active" },
    { id: 2, title: "Traffic Calming Measures", description: "Install speed bumps on Main Street", votes: { yes: 38, no: 22 }, deadline: "2 days", status: "Active" },
    { id: 3, title: "Annual Budget Allocation", description: "Approve 2025 community budget", votes: { yes: 67, no: 8 }, deadline: "Closed", status: "Passed" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Voting System</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Create New Proposal
      </Button>

      <div className="space-y-3">
        {proposals.map(proposal => (
          <Card key={proposal.id} className="p-3">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                  <p className="text-sm text-gray-600">{proposal.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  proposal.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                  proposal.status === 'Passed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {proposal.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Yes: {proposal.votes.yes}</span>
                  <span>No: {proposal.votes.no}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-green-500"
                    style={{
                      width: `${(proposal.votes.yes / (proposal.votes.yes + proposal.votes.no)) * 100}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {proposal.deadline !== 'Closed' ? `${proposal.deadline} remaining` : 'Voting closed'}
                </div>
              </div>

              {proposal.status === 'Active' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700">
                    Vote Yes
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs border-red-300 text-red-600 hover:bg-red-50">
                    Vote No
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ProposalBuilder({ layer, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Infrastructure',
    duration: '7'
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Proposal Builder</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Enter proposal title..."
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Describe your proposal..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Infrastructure</option>
              <option>Community</option>
              <option>Environment</option>
              <option>Budget</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voting Duration</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
            >
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
          </div>
        </div>

        <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          Submit Proposal
        </Button>
      </div>
    </div>
  );
}

function DiscussionForums({ layer, onClose }) {
  const [discussions, setDiscussions] = useState([
    { id: 1, title: "Community Garden Location", author: "Sarah M.", replies: 12, lastActivity: "2 hours ago", category: "Environment" },
    { id: 2, title: "Traffic Safety Concerns", author: "John D.", replies: 8, lastActivity: "5 hours ago", category: "Infrastructure" },
    { id: 3, title: "Youth Programs Funding", author: "Emma L.", replies: 15, lastActivity: "1 day ago", category: "Community" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Discussion Forums</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Start New Discussion
      </Button>

      <div className="space-y-3">
        {discussions.map(discussion => (
          <Card key={discussion.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{discussion.title}</h4>
                  <p className="text-sm text-gray-600">by {discussion.author}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {discussion.category}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{discussion.replies} replies</span>
                <span>Last activity: {discussion.lastActivity}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function DecisionArchive({ layer, onClose }) {
  const [decisions, setDecisions] = useState([
    { id: 1, title: "Playground Equipment Upgrade", date: "Dec 2024", result: "Approved", votes: "52-8", impact: "High" },
    { id: 2, title: "Street Lighting Improvement", date: "Nov 2024", result: "Approved", votes: "45-15", impact: "Medium" },
    { id: 3, title: "Dog Park Proposal", date: "Oct 2024", result: "Rejected", votes: "23-37", impact: "Low" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Decision Archive</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="text-xs">Filter by Date</Button>
        <Button variant="outline" size="sm" className="text-xs">Filter by Result</Button>
      </div>

      <div className="space-y-3">
        {decisions.map(decision => (
          <Card key={decision.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{decision.title}</h4>
                  <p className="text-sm text-gray-600">{decision.date}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    decision.result === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {decision.result}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    Impact: {decision.impact}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Final vote: {decision.votes}</span>
                <Button size="sm" variant="outline" className="text-xs">
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Mind Layer Tools
function LearningPaths({ layer, onClose }) {
  const [paths, setPaths] = useState([
    { id: 1, title: "Sustainable Living", progress: 60, modules: 8, completed: 5, difficulty: "Beginner", duration: "4 weeks" },
    { id: 2, title: "Local History & Heritage", progress: 25, modules: 12, completed: 3, difficulty: "Intermediate", duration: "6 weeks" },
    { id: 3, title: "Community Leadership", progress: 0, modules: 10, completed: 0, difficulty: "Advanced", duration: "8 weeks" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Learning Paths</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Create Custom Path
      </Button>

      <div className="space-y-3">
        {paths.map(path => (
          <Card key={path.id} className="p-3">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{path.title}</h4>
                  <p className="text-sm text-gray-600">{path.modules} modules • {path.duration}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  path.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                  path.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {path.difficulty}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress: {path.completed}/{path.modules} modules</span>
                  <span>{path.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${path.progress}%`,
                      backgroundColor: LAYER_CONFIG[layer]?.color
                    }}
                  />
                </div>
              </div>

              <Button
                size="sm"
                className="w-full text-xs"
                style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
              >
                {path.progress > 0 ? 'Continue Learning' : 'Start Path'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SkillMatcher({ layer, onClose }) {
  const [matches, setMatches] = useState([
    { id: 1, skill: "Web Development", teacher: "Alex R.", rating: 4.9, availability: "Weekends", price: "£25/hour" },
    { id: 2, skill: "Organic Gardening", teacher: "Mary S.", rating: 4.8, availability: "Afternoons", price: "£15/hour" },
    { id: 3, skill: "Photography", teacher: "David L.", rating: 4.7, availability: "Evenings", price: "£20/hour" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Skill Matcher</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xs">Find Teacher</Button>
        <Button className="text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          Offer Teaching
        </Button>
      </div>

      <div className="space-y-3">
        {matches.map(match => (
          <Card key={match.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{match.skill}</h4>
                  <p className="text-sm text-gray-600">with {match.teacher}</p>
                  <p className="text-xs text-gray-500">{match.availability} • {match.price}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm" style={{ color: LAYER_CONFIG[layer]?.color }}>
                    ⭐ {match.rating}
                  </div>
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                Connect
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AIAssistant({ layer, onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', content: "Hello! I'm SILAS, your community AI assistant. How can I help you today?" },
    { id: 2, type: 'user', content: "What community events are happening this week?" },
    { id: 3, type: 'ai', content: "This week we have: Sunday Service (Jan 12, 10 AM), Community Garden workday (Jan 14, 2 PM), and Town Hall meeting (Jan 16, 7 PM). Would you like details about any of these?" }
  ]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Ask SILAS AI</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              message.type === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Ask SILAS anything..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <Button size="sm" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          Send
        </Button>
      </div>
    </div>
  );
}

function KnowledgeBase({ layer, onClose }) {
  const [articles, setArticles] = useState([
    { id: 1, title: "Community Guidelines", category: "Governance", views: 234, updated: "1 week ago" },
    { id: 2, title: "Local Business Directory", category: "Economy", views: 189, updated: "3 days ago" },
    { id: 3, title: "Emergency Procedures", category: "Safety", views: 156, updated: "2 weeks ago" },
    { id: 4, title: "Recycling & Waste Guide", category: "Environment", views: 145, updated: "1 month ago" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Knowledge Base</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Search knowledge base..."
        />
        <Button size="sm" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          Search
        </Button>
      </div>

      <div className="space-y-3">
        {articles.map(article => (
          <Card key={article.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{article.title}</h4>
                  <p className="text-sm text-gray-600">{article.category}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  <div>{article.views} views</div>
                  <div>{article.updated}</div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Contribute Article
      </Button>
    </div>
  );
}

// Pulse Layer Tools
function AnalyticsDashboard({ layer, onClose }) {
  const [metrics, setMetrics] = useState({
    totalUsers: 234,
    activeToday: 45,
    postsThisWeek: 28,
    engagementRate: 73,
    communityHealth: 85
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Analytics Dashboard</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
            {metrics.totalUsers}
          </div>
          <div className="text-sm text-gray-600">Total Users</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
            {metrics.activeToday}
          </div>
          <div className="text-sm text-gray-600">Active Today</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
            {metrics.postsThisWeek}
          </div>
          <div className="text-sm text-gray-600">Posts This Week</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
            {metrics.engagementRate}%
          </div>
          <div className="text-sm text-gray-600">Engagement Rate</div>
        </Card>
      </div>

      <Card className="p-4">
        <h4 className="font-medium mb-3">Community Health Score</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Health</span>
            <span>{metrics.communityHealth}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all bg-green-500"
              style={{ width: `${metrics.communityHealth}%` }}
            />
          </div>
        </div>
      </Card>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Generate Report
      </Button>
    </div>
  );
}

function HealthMetrics({ layer, onClose }) {
  const [healthData, setHealthData] = useState([
    { metric: "Community Participation", score: 78, trend: "up", change: "+5%" },
    { metric: "Economic Activity", score: 82, trend: "up", change: "+12%" },
    { metric: "Social Cohesion", score: 71, trend: "stable", change: "0%" },
    { metric: "Environmental Health", score: 85, trend: "up", change: "+3%" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Health Metrics</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {healthData.map((item, index) => (
          <Card key={index} className="p-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{item.metric}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${
                    item.trend === 'up' ? 'text-green-600' :
                    item.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {item.trend === 'up' ? '↗️' : item.trend === 'down' ? '↘️' : '➡️'} {item.change}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span>{item.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: LAYER_CONFIG[layer]?.color
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Commerce Layer Tools
function Marketplace({ layer, onClose }) {
  const [listings, setListings] = useState([
    { id: 1, title: "Fresh Vegetables", seller: "Green Valley Farm", price: "£15", category: "Food", image: "🥕" },
    { id: 2, title: "Handmade Pottery", seller: "Local Crafts Co.", price: "£25", category: "Crafts", image: "🏺" },
    { id: 3, title: "Honey (Local)", seller: "Bee Happy Farm", price: "£8", category: "Food", image: "🍯" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Marketplace</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xs">Browse All</Button>
        <Button className="text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          List Item
        </Button>
      </div>

      <div className="space-y-3">
        {listings.map(listing => (
          <Card key={listing.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{listing.image}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{listing.title}</h4>
                <p className="text-sm text-gray-600">by {listing.seller}</p>
                <p className="text-xs text-gray-500">{listing.category}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                  {listing.price}
                </div>
                <Button size="sm" className="text-xs mt-1" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                  Buy
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ServiceDirectory({ layer, onClose }) {
  const [services, setServices] = useState([
    { id: 1, name: "Home Repairs", provider: "Fix-It Solutions", rating: 4.8, price: "£30/hour", available: true },
    { id: 2, name: "Garden Maintenance", provider: "Green Thumb Services", rating: 4.9, price: "£25/hour", available: true },
    { id: 3, name: "Pet Sitting", provider: "Caring Paws", rating: 4.7, price: "£15/day", available: false }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Service Directory</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Offer Service
      </Button>

      <div className="space-y-3">
        {services.map(service => (
          <Card key={service.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600">{service.provider}</p>
                  <p className="text-xs text-gray-500">⭐ {service.rating} • {service.price}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  service.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {service.available ? 'Available' : 'Busy'}
                </span>
              </div>
              <Button
                size="sm"
                className="w-full text-xs"
                disabled={!service.available}
                style={{ backgroundColor: service.available ? LAYER_CONFIG[layer]?.color : '#gray' }}
              >
                {service.available ? 'Book Service' : 'Unavailable'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Faith Layer Quick Actions
function ScheduleService({ layer, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: 'Community Center',
    description: '',
    capacity: '50'
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Schedule Service</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="e.g., Sunday Morning Service"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            >
              <option>Community Center</option>
              <option>Parish Hall</option>
              <option>Village Green</option>
              <option>Town Square</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.capacity}
              onChange={(e) => setFormData({...formData, capacity: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Service details and special notes..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Schedule Service
          </Button>
        </div>
      </div>
    </div>
  );
}

function CreateEvent({ layer, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Community Gathering',
    date: '',
    time: '',
    location: '',
    description: '',
    isRecurring: false
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Create Event</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="e.g., Community Prayer Circle"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
          >
            <option>Community Gathering</option>
            <option>Prayer Meeting</option>
            <option>Bible Study</option>
            <option>Outreach Event</option>
            <option>Fellowship</option>
            <option>Youth Activity</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Event location"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Event details..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recurring"
            checked={formData.isRecurring}
            onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
          />
          <label htmlFor="recurring" className="text-sm text-gray-700">Recurring event</label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Create Event
          </Button>
        </div>
      </div>
    </div>
  );
}

function JoinMinistry({ layer, onClose }) {
  const [ministries, setMinistries] = useState([
    { id: 1, name: "Music Ministry", description: "Lead worship through music", commitment: "Weekly", members: 12 },
    { id: 2, name: "Children's Ministry", description: "Teaching and caring for children", commitment: "Bi-weekly", members: 8 },
    { id: 3, name: "Outreach Ministry", description: "Community service and evangelism", commitment: "Monthly", members: 15 },
    { id: 4, name: "Prayer Ministry", description: "Intercessory prayer and support", commitment: "Weekly", members: 20 }
  ]);
  const [selectedMinistry, setSelectedMinistry] = useState(null);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Join Ministry</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {ministries.map(ministry => (
          <Card
            key={ministry.id}
            className={`p-3 cursor-pointer transition-all ${
              selectedMinistry === ministry.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedMinistry(ministry.id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{ministry.name}</h4>
                  <p className="text-sm text-gray-600">{ministry.description}</p>
                  <p className="text-xs text-gray-500">Commitment: {ministry.commitment} • {ministry.members} members</p>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    name="ministry"
                    checked={selectedMinistry === ministry.id}
                    onChange={() => setSelectedMinistry(ministry.id)}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedMinistry && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium">Application Details</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to join?</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-16"
              placeholder="Share your motivation..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relevant experience</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-16"
              placeholder="Any relevant skills or experience..."
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selectedMinistry}
          style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
        >
          Submit Application
        </Button>
      </div>
    </div>
  );
}

function ShareTestimony({ layer, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Personal Growth',
    testimony: '',
    isAnonymous: false,
    allowSharing: true
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Share Testimony</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Brief title for your testimony"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option>Personal Growth</option>
            <option>Healing & Recovery</option>
            <option>Community Impact</option>
            <option>Faith Journey</option>
            <option>Answered Prayer</option>
            <option>Service & Ministry</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Testimony</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-32"
            placeholder="Share your story and how it has impacted your life or community..."
            value={formData.testimony}
            onChange={(e) => setFormData({...formData, testimony: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData({...formData, isAnonymous: e.target.checked})}
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">Share anonymously</label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sharing"
              checked={formData.allowSharing}
              onChange={(e) => setFormData({...formData, allowSharing: e.target.checked})}
            />
            <label htmlFor="sharing" className="text-sm text-gray-700">Allow sharing with other communities</label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Share Testimony
          </Button>
        </div>
      </div>
    </div>
  );
}

// Tool Renderer Function
function renderTool(tool, layer, onClose) {
  const toolComponents = {
    'Faith': {
      'Event Calendar': () => <EventCalendar layer={layer} onClose={onClose} />,
      'Prayer Requests': () => <PrayerRequests layer={layer} onClose={onClose} />,
      'Community Outreach': () => <CommunityOutreach layer={layer} onClose={onClose} />,
      'Volunteer Coordination': () => <VolunteerCoordination layer={layer} onClose={onClose} />
    },
    'Economy': {
      'Business Directory': () => <BusinessDirectory layer={layer} onClose={onClose} />,
      'Economic Indicators': () => <EconomicIndicators layer={layer} onClose={onClose} />,
      'Investment Opportunities': () => <InvestmentOpportunities layer={layer} onClose={onClose} />,
      'Skills Exchange': () => <SkillsExchange layer={layer} onClose={onClose} />
    },
    'Works': {
      'Project Tracker': () => <ProjectTracker layer={layer} onClose={onClose} />,
      'Resource Manager': () => <ResourceManager layer={layer} onClose={onClose} />,
      'Volunteer Hub': () => renderTool('Volunteer Hub', layer, onClose),
      'Progress Dashboard': () => renderTool('Progress Dashboard', layer, onClose)
    },
    'Circle': {
      'Voting System': () => <VotingSystem layer={layer} onClose={onClose} />,
      'Proposal Builder': () => <ProposalBuilder layer={layer} onClose={onClose} />,
      'Discussion Forums': () => <DiscussionForums layer={layer} onClose={onClose} />,
      'Decision Archive': () => <DecisionArchive layer={layer} onClose={onClose} />
    },
    'Mind': {
      'Learning Paths': () => <LearningPaths layer={layer} onClose={onClose} />,
      'Skill Matcher': () => <SkillMatcher layer={layer} onClose={onClose} />,
      'AI Assistant': () => <AIAssistant layer={layer} onClose={onClose} />,
      'Knowledge Base': () => <KnowledgeBase layer={layer} onClose={onClose} />
    },
    'Pulse': {
      'Analytics Dashboard': () => <AnalyticsDashboard layer={layer} onClose={onClose} />,
      'Health Metrics': () => <HealthMetrics layer={layer} onClose={onClose} />,
      'Demographics Comparison': () => <DemographicComparison layer={layer} onClose={onClose} />,
      'Trend Analysis': () => renderTool('Trend Analysis', layer, onClose)
    },
    'Commerce': {
      'Marketplace': () => <Marketplace layer={layer} onClose={onClose} />,
      'Service Directory': () => <ServiceDirectory layer={layer} onClose={onClose} />,
      'Local Currency': () => renderTool('Local Currency', layer, onClose),
      'Trade Network': () => renderTool('Trade Network', layer, onClose)
    }
  };

  const layerTools = toolComponents[layer];
  if (layerTools && layerTools[tool]) {
    return layerTools[tool]();
  }

  // Default tool placeholder for tools not yet implemented
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>{tool}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🚧</div>
        <p className="font-medium">Coming Soon</p>
        <p className="text-sm">This tool is under development</p>
      </div>
    </div>
  );
}

// Economy Layer Quick Actions
function ListBusiness({ layer, onClose }) {
  const [formData, setFormData] = useState({
    businessName: '',
    category: 'Food & Dining',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    hours: '',
    services: ''
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>List Business</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Your business name"
            value={formData.businessName}
            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Food & Dining</option>
              <option>Retail</option>
              <option>Services</option>
              <option>Agriculture</option>
              <option>Crafts & Arts</option>
              <option>Professional Services</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Business phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Brief description of your business..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Business address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="contact@business.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="www.business.com"
              value={formData.website}
              onChange={(e) => setFormData({...formData, website: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="e.g., Mon-Fri 9AM-5PM"
            value={formData.hours}
            onChange={(e) => setFormData({...formData, hours: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            List Business
          </Button>
        </div>
      </div>
    </div>
  );
}

function FindMentor({ layer, onClose }) {
  const [searchData, setSearchData] = useState({
    industry: 'All Industries',
    experience: 'Any Level',
    availability: 'Any Time',
    location: 'Local Only'
  });

  const [mentors, setMentors] = useState([
    { id: 1, name: "Sarah Johnson", industry: "Retail", experience: "15 years", rating: 4.9, availability: "Weekends", specialties: ["Business Planning", "Marketing"] },
    { id: 2, name: "Mike Roberts", industry: "Agriculture", experience: "20 years", rating: 4.8, availability: "Evenings", specialties: ["Sustainable Farming", "Supply Chain"] },
    { id: 3, name: "Emma Davis", industry: "Professional Services", experience: "12 years", rating: 4.7, availability: "Flexible", specialties: ["Finance", "Legal Compliance"] }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Find Mentor</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={searchData.industry}
            onChange={(e) => setSearchData({...searchData, industry: e.target.value})}
          >
            <option>All Industries</option>
            <option>Retail</option>
            <option>Agriculture</option>
            <option>Professional Services</option>
            <option>Food & Dining</option>
            <option>Crafts & Arts</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={searchData.experience}
            onChange={(e) => setSearchData({...searchData, experience: e.target.value})}
          >
            <option>Any Level</option>
            <option>5+ years</option>
            <option>10+ years</option>
            <option>15+ years</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {mentors.map(mentor => (
          <Card key={mentor.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{mentor.name}</h4>
                  <p className="text-sm text-gray-600">{mentor.industry} • {mentor.experience} experience</p>
                  <p className="text-xs text-gray-500">Available: {mentor.availability}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm" style={{ color: LAYER_CONFIG[layer]?.color }}>
                    ⭐ {mentor.rating}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {mentor.specialties.map((specialty, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {specialty}
                  </span>
                ))}
              </div>
              <Button size="sm" className="w-full text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                Request Mentorship
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Works Layer Quick Actions
function StartProject({ layer, onClose }) {
  const [formData, setFormData] = useState({
    projectName: '',
    category: 'Infrastructure',
    description: '',
    timeline: '3 months',
    budget: '',
    volunteersNeeded: '5',
    skills: '',
    location: '',
    goals: ''
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Start Project</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Name your community project"
            value={formData.projectName}
            onChange={(e) => setFormData({...formData, projectName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Infrastructure</option>
              <option>Environment</option>
              <option>Community Space</option>
              <option>Education</option>
              <option>Health & Safety</option>
              <option>Arts & Culture</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.timeline}
              onChange={(e) => setFormData({...formData, timeline: e.target.value})}
            >
              <option>1 month</option>
              <option>3 months</option>
              <option>6 months</option>
              <option>1 year</option>
              <option>Ongoing</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Describe your project and its impact on the community..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="£0 - £1000"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Volunteers Needed</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.volunteersNeeded}
              onChange={(e) => setFormData({...formData, volunteersNeeded: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills Needed</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="e.g., Carpentry, Gardening, Project Management"
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Create Project
          </Button>
        </div>
      </div>
    </div>
  );
}

function JoinTeam({ layer, onClose }) {
  const [projects, setProjects] = useState([
    { id: 1, name: "Community Garden Expansion", team: 8, needed: 12, skills: ["Gardening", "Construction"], commitment: "Weekends", urgency: "High" },
    { id: 2, name: "Playground Renovation", team: 5, needed: 10, skills: ["Carpentry", "Painting"], commitment: "Evenings", urgency: "Medium" },
    { id: 3, name: "Village Hall Repairs", team: 12, needed: 15, skills: ["Electrical", "Plumbing"], commitment: "Flexible", urgency: "Low" }
  ]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [userSkills, setUserSkills] = useState('');
  const [availability, setAvailability] = useState('');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Join Team</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {projects.map(project => (
          <Card
            key={project.id}
            className={`p-3 cursor-pointer transition-all ${
              selectedProject === project.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedProject(project.id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-600">Team: {project.team}/{project.needed} volunteers</p>
                  <p className="text-xs text-gray-500">Commitment: {project.commitment}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.urgency === 'High' ? 'bg-red-100 text-red-800' :
                    project.urgency === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {project.urgency} Priority
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {project.skills.map((skill, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(project.team / project.needed) * 100}%`,
                    backgroundColor: LAYER_CONFIG[layer]?.color
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedProject && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium">Join Application</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Skills</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="List your relevant skills..."
              value={userSkills}
              onChange={(e) => setUserSkills(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="">Select availability</option>
              <option>Weekdays</option>
              <option>Weekends</option>
              <option>Evenings</option>
              <option>Flexible</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selectedProject}
          style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
        >
          Join Team
        </Button>
      </div>
    </div>
  );
}

// Circle Layer Quick Actions
function CreateProposal({ layer, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Infrastructure',
    description: '',
    rationale: '',
    impact: '',
    budget: '',
    timeline: '30 days',
    votingDuration: '7 days',
    attachments: []
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Create Proposal</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Clear, concise title for your proposal"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Infrastructure</option>
              <option>Budget</option>
              <option>Community</option>
              <option>Environment</option>
              <option>Policy</option>
              <option>Services</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voting Duration</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.votingDuration}
              onChange={(e) => setFormData({...formData, votingDuration: e.target.value})}
            >
              <option>3 days</option>
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Detailed description of your proposal..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rationale</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-16"
            placeholder="Why is this proposal necessary?"
            value={formData.rationale}
            onChange={(e) => setFormData({...formData, rationale: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Budget</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="£0 - £10,000"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Timeline</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.timeline}
              onChange={(e) => setFormData({...formData, timeline: e.target.value})}
            >
              <option>30 days</option>
              <option>3 months</option>
              <option>6 months</option>
              <option>1 year</option>
              <option>Ongoing</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Save Draft</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Submit Proposal
          </Button>
        </div>
      </div>
    </div>
  );
}

function CastVote({ layer, onClose }) {
  const [activeProposals, setActiveProposals] = useState([
    { id: 1, title: "New Community Center Hours", description: "Extend opening hours to 9 PM weekdays", votes: { yes: 45, no: 12 }, deadline: "3 days", hasVoted: false },
    { id: 2, title: "Traffic Calming Measures", description: "Install speed bumps on Main Street", votes: { yes: 38, no: 22 }, deadline: "1 day", hasVoted: false },
    { id: 3, title: "Community Garden Expansion", description: "Add 20 new plots to existing garden", votes: { yes: 52, no: 8 }, deadline: "5 days", hasVoted: true }
  ]);

  const handleVote = (proposalId, vote) => {
    setActiveProposals(prev => prev.map(proposal =>
      proposal.id === proposalId
        ? {
            ...proposal,
            hasVoted: true,
            votes: {
              yes: proposal.votes.yes + (vote === 'yes' ? 1 : 0),
              no: proposal.votes.no + (vote === 'no' ? 1 : 0)
            }
          }
        : proposal
    ));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Cast Vote</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {activeProposals.map(proposal => (
          <Card key={proposal.id} className="p-3">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{proposal.title}</h4>
                  <p className="text-sm text-gray-600">{proposal.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Deadline: {proposal.deadline} remaining</p>
                </div>
                {proposal.hasVoted && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    Voted
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Yes: {proposal.votes.yes}</span>
                  <span>No: {proposal.votes.no}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all bg-green-500"
                    style={{
                      width: `${(proposal.votes.yes / (proposal.votes.yes + proposal.votes.no)) * 100}%`
                    }}
                  />
                </div>
              </div>

              {!proposal.hasVoted ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="text-xs bg-green-600 hover:bg-green-700"
                    onClick={() => handleVote(proposal.id, 'yes')}
                  >
                    Vote Yes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleVote(proposal.id, 'no')}
                  >
                    Vote No
                  </Button>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 py-2">
                  Thank you for voting!
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function JoinDiscussion({ layer, onClose }) {
  const [discussions, setDiscussions] = useState([
    { id: 1, title: "Community Garden Location", author: "Sarah M.", replies: 12, lastActivity: "2 hours ago", category: "Environment", isJoined: false },
    { id: 2, title: "Traffic Safety Concerns", author: "John D.", replies: 8, lastActivity: "5 hours ago", category: "Infrastructure", isJoined: true },
    { id: 3, title: "Youth Programs Funding", author: "Emma L.", replies: 15, lastActivity: "1 day ago", category: "Community", isJoined: false }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);

  const joinDiscussion = (discussionId) => {
    setDiscussions(prev => prev.map(discussion =>
      discussion.id === discussionId
        ? { ...discussion, isJoined: true, replies: discussion.replies + 1 }
        : discussion
    ));
    setSelectedDiscussion(null);
    setNewMessage('');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Join Discussion</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {discussions.map(discussion => (
          <Card key={discussion.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{discussion.title}</h4>
                  <p className="text-sm text-gray-600">by {discussion.author}</p>
                  <p className="text-xs text-gray-500">{discussion.replies} replies • {discussion.lastActivity}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {discussion.category}
                  </span>
                  {discussion.isJoined && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      Joined
                    </span>
                  )}
                </div>
              </div>

              {!discussion.isJoined ? (
                <div className="space-y-2">
                  <Button
                    size="sm"
                    className="w-full text-xs"
                    style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
                    onClick={() => setSelectedDiscussion(discussion.id)}
                  >
                    Join Discussion
                  </Button>

                  {selectedDiscussion === discussion.id && (
                    <div className="space-y-2 p-2 bg-gray-50 rounded">
                      <textarea
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs h-16"
                        placeholder="Add your thoughts to the discussion..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs flex-1"
                          onClick={() => setSelectedDiscussion(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="text-xs flex-1"
                          style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
                          onClick={() => joinDiscussion(discussion.id)}
                          disabled={!newMessage.trim()}
                        >
                          Post & Join
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                >
                  View Discussion
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ViewResults({ layer, onClose }) {
  const [results, setResults] = useState([
    {
      id: 1,
      title: "Playground Equipment Upgrade",
      date: "Dec 2024",
      result: "Approved",
      votes: { yes: 52, no: 8 },
      turnout: "68%",
      status: "In Progress",
      implementation: 45
    },
    {
      id: 2,
      title: "Street Lighting Improvement",
      date: "Nov 2024",
      result: "Approved",
      votes: { yes: 45, no: 15 },
      turnout: "72%",
      status: "Completed",
      implementation: 100
    },
    {
      id: 3,
      title: "Dog Park Proposal",
      date: "Oct 2024",
      result: "Rejected",
      votes: { yes: 23, no: 37 },
      turnout: "65%",
      status: "Closed",
      implementation: 0
    }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>View Results</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" size="sm" className="text-xs">All Results</Button>
        <Button variant="outline" size="sm" className="text-xs">Approved</Button>
        <Button variant="outline" size="sm" className="text-xs">In Progress</Button>
      </div>

      <div className="space-y-3">
        {results.map(result => (
          <Card key={result.id} className="p-3">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{result.title}</h4>
                  <p className="text-sm text-gray-600">{result.date} • Turnout: {result.turnout}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    result.result === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.result}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">{result.status}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Yes: {result.votes.yes}</span>
                  <span>No: {result.votes.no}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      result.result === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${(result.votes.yes / (result.votes.yes + result.votes.no)) * 100}%`
                    }}
                  />
                </div>
              </div>

              {result.result === 'Approved' && result.status !== 'Completed' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Implementation Progress</span>
                    <span>{result.implementation}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${result.implementation}%`,
                        backgroundColor: LAYER_CONFIG[layer]?.color
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Mind Layer Quick Actions
function StartCourse({ layer, onClose }) {
  const [courses, setCourses] = useState([
    { id: 1, title: "Sustainable Living Basics", duration: "4 weeks", difficulty: "Beginner", modules: 8, enrolled: 23, rating: 4.8 },
    { id: 2, title: "Local History & Heritage", duration: "6 weeks", difficulty: "Intermediate", modules: 12, enrolled: 15, rating: 4.9 },
    { id: 3, title: "Community Leadership", duration: "8 weeks", difficulty: "Advanced", modules: 10, enrolled: 8, rating: 4.7 },
    { id: 4, title: "Digital Skills for Seniors", duration: "3 weeks", difficulty: "Beginner", modules: 6, enrolled: 31, rating: 4.6 }
  ]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Start Course</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {courses.map(course => (
          <Card
            key={course.id}
            className={`p-3 cursor-pointer transition-all ${
              selectedCourse === course.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedCourse(course.id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{course.title}</h4>
                  <p className="text-sm text-gray-600">{course.duration} • {course.modules} modules</p>
                  <p className="text-xs text-gray-500">{course.enrolled} enrolled • ⭐ {course.rating}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
                  course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {course.difficulty}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedCourse && (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium">Enrollment Details</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Learning Goals</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-16"
              placeholder="What do you hope to achieve from this course?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Time</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
              <option>1-2 hours per week</option>
              <option>3-4 hours per week</option>
              <option>5+ hours per week</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={!selectedCourse}
          style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
        >
          Enroll in Course
        </Button>
      </div>
    </div>
  );
}

function ShareKnowledge({ layer, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Skills & Crafts',
    type: 'Article',
    content: '',
    tags: '',
    difficulty: 'Beginner',
    timeToRead: '5 minutes'
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Share Knowledge</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="What knowledge are you sharing?"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Skills & Crafts</option>
              <option>Local History</option>
              <option>Gardening & Nature</option>
              <option>Technology</option>
              <option>Health & Wellness</option>
              <option>Business & Finance</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option>Article</option>
              <option>Tutorial</option>
              <option>Guide</option>
              <option>Tips & Tricks</option>
              <option>Resource List</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-32"
            placeholder="Share your knowledge, experience, or insights..."
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.difficulty}
              onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Expert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reading Time</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.timeToRead}
              onChange={(e) => setFormData({...formData, timeToRead: e.target.value})}
            >
              <option>2 minutes</option>
              <option>5 minutes</option>
              <option>10 minutes</option>
              <option>15+ minutes</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="e.g., woodworking, beginner, tools"
            value={formData.tags}
            onChange={(e) => setFormData({...formData, tags: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Save Draft</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Publish Knowledge
          </Button>
        </div>
      </div>
    </div>
  );
}

function AskSILAS({ layer, onClose }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', content: "Hello! I'm SILAS, your community AI assistant. What would you like to know about Stoneclough?" },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    "What events are happening this week?",
    "How can I get involved in community projects?",
    "What local businesses are recommended?",
    "How do I submit a community proposal?"
  ];

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = { id: Date.now(), type: 'user', content: newMessage };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: `I understand you're asking about "${newMessage}". Based on our community data, I can help you with that. Would you like me to provide specific details or connect you with relevant community members?`
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const askQuickQuestion = (question) => {
    setNewMessage(question);
  };

  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Ask SILAS</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              message.type === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 p-3 rounded-lg text-sm">
              SILAS is typing...
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2">
          <p className="text-xs text-gray-500">Quick questions:</p>
          {quickQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs justify-start"
              onClick={() => askQuickQuestion(question)}
            >
              {question}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Ask SILAS anything about the community..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button
            size="sm"
            style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
            onClick={sendMessage}
            disabled={!newMessage.trim() || isTyping}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function FindTutor({ layer, onClose }) {
  const [searchData, setSearchData] = useState({
    subject: 'All Subjects',
    level: 'Any Level',
    availability: 'Any Time',
    format: 'Any Format'
  });

  const [tutors, setTutors] = useState([
    { id: 1, name: "Dr. Sarah Wilson", subject: "Mathematics", level: "GCSE/A-Level", rating: 4.9, price: "£25/hour", availability: "Weekends", format: "In-person" },
    { id: 2, name: "James Mitchell", subject: "Guitar", level: "Beginner to Advanced", rating: 4.8, price: "£20/hour", availability: "Evenings", format: "Both" },
    { id: 3, name: "Emma Thompson", subject: "French", level: "Conversational", rating: 4.7, price: "£18/hour", availability: "Flexible", format: "Online" },
    { id: 4, name: "Robert Chen", subject: "Computer Programming", level: "Beginner", rating: 4.9, price: "£30/hour", availability: "Weekdays", format: "Both" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Find Tutor</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={searchData.subject}
            onChange={(e) => setSearchData({...searchData, subject: e.target.value})}
          >
            <option>All Subjects</option>
            <option>Mathematics</option>
            <option>Languages</option>
            <option>Music</option>
            <option>Technology</option>
            <option>Arts & Crafts</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={searchData.format}
            onChange={(e) => setSearchData({...searchData, format: e.target.value})}
          >
            <option>Any Format</option>
            <option>In-person</option>
            <option>Online</option>
            <option>Both</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {tutors.map(tutor => (
          <Card key={tutor.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{tutor.name}</h4>
                  <p className="text-sm text-gray-600">{tutor.subject} • {tutor.level}</p>
                  <p className="text-xs text-gray-500">{tutor.availability} • {tutor.format}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium" style={{ color: LAYER_CONFIG[layer]?.color }}>
                    {tutor.price}
                  </div>
                  <div className="text-xs text-gray-500">⭐ {tutor.rating}</div>
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                Contact Tutor
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Pulse Layer Quick Actions
function ViewReports({ layer, onClose }) {
  const [reportType, setReportType] = useState('Community Overview');
  const [timeframe, setTimeframe] = useState('This Month');

  const reports = {
    'Community Overview': {
      metrics: [
        { name: 'Active Users', value: '234', change: '+12%', trend: 'up' },
        { name: 'New Posts', value: '89', change: '+23%', trend: 'up' },
        { name: 'Events Attended', value: '156', change: '+8%', trend: 'up' },
        { name: 'Projects Active', value: '12', change: '+2', trend: 'up' }
      ]
    },
    'Engagement Analytics': {
      metrics: [
        { name: 'Daily Active Users', value: '45', change: '+5%', trend: 'up' },
        { name: 'Comments per Post', value: '3.2', change: '+0.4', trend: 'up' },
        { name: 'Event Participation', value: '68%', change: '+12%', trend: 'up' },
        { name: 'Voting Turnout', value: '72%', change: '+8%', trend: 'up' }
      ]
    },
    'Demographic Analysis': {
      metrics: [
        { name: 'Total Population', value: formatPopulation(censusData.stoneclough.totalPopulation), change: 'vs Bolton', trend: 'neutral', comparison: formatPopulation(censusData.bolton.totalPopulation) },
        { name: 'Young Professionals (25-34)', value: formatPercentage(censusData.stoneclough.ageGroups['25-34']), change: '+2.1%', trend: 'up', comparison: `vs Bolton ${formatPercentage(censusData.bolton.ageGroups['25-34'])}` },
        { name: 'Higher Education', value: formatPercentage(censusData.stoneclough.education.level4Plus), change: '+4.9%', trend: 'up', comparison: `vs England ${formatPercentage(censusData.england.education.level4Plus)}` },
        { name: 'Home Ownership', value: formatPercentage(censusData.stoneclough.housing.owned), change: '+19.5%', trend: 'up', comparison: `vs England ${formatPercentage(censusData.england.housing.owned)}` }
      ]
    },
    'Community Comparison': {
      metrics: [
        { name: 'Employment Rate', value: formatPercentage(censusData.stoneclough.employment.employed), change: '+6.1%', trend: 'up', comparison: `vs Bolton ${formatPercentage(censusData.bolton.employment.employed)}` },
        { name: 'Families (35-49)', value: formatPercentage(censusData.stoneclough.ageGroups['35-49']), change: '+4.5%', trend: 'up', comparison: `vs Bolton ${formatPercentage(censusData.bolton.ageGroups['35-49'])}` },
        { name: 'Senior Citizens (65+)', value: formatPercentage(censusData.stoneclough.ageGroups['65+']), change: '-6.0%', trend: 'down', comparison: `vs Bolton ${formatPercentage(censusData.bolton.ageGroups['65+'])}` },
        { name: 'Social Housing', value: formatPercentage(censusData.stoneclough.housing.socialRented), change: '-8.6%', trend: 'down', comparison: `vs Bolton ${formatPercentage(censusData.bolton.housing.socialRented)}` }
      ]
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>View Reports</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option>Community Overview</option>
            <option>Engagement Analytics</option>
            <option>Demographic Analysis</option>
            <option>Community Comparison</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option>This Week</option>
            <option>This Month</option>
            <option>Last 3 Months</option>
            <option>This Year</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {reports[reportType]?.metrics.map((metric, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{metric.name}</h4>
                <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                  {metric.value}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm flex items-center gap-1 ${
                  metric.trend === 'up' ? 'text-green-600' :
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <span>{metric.trend === 'up' ? '↗️' : metric.trend === 'down' ? '↘️' : '➡️'}</span>
                  {metric.change}
                </div>
                {metric.comparison && (
                  <div className="text-xs text-gray-500 mt-1">
                    {metric.comparison}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="text-xs">Export PDF</Button>
        <Button className="text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          Schedule Report
        </Button>
      </div>
    </div>
  );
}

function SetGoals({ layer, onClose }) {
  // Generate demographic-aware goals based on census data
  const generateSmartGoals = () => {
    const insights = getCommunityInsights();
    const baseGoals = [
      { id: 1, title: 'Increase Community Participation', target: 300, current: 234, deadline: '2025-03-01', category: 'Engagement' },
      { id: 2, title: 'Complete 5 Community Projects', target: 5, current: 3, deadline: '2025-06-01', category: 'Projects' },
      { id: 3, title: 'Host 12 Monthly Events', target: 12, current: 8, deadline: '2025-12-01', category: 'Events' }
    ];

    // Add demographic-specific goals
    const youngProfessionals = censusData.stoneclough.ageGroups['25-34'];
    const boltonYoungProfessionals = censusData.bolton.ageGroups['25-34'];

    if (youngProfessionals > boltonYoungProfessionals) {
      baseGoals.push({
        id: 4,
        title: 'Launch Young Professional Network',
        target: 50,
        current: 12,
        deadline: '2025-04-01',
        category: 'Demographics',
        insight: `Leverage ${formatPercentage(youngProfessionals)} young professional population`
      });
    }

    const highEducation = censusData.stoneclough.education.level4Plus;
    const englandHighEducation = censusData.england.education.level4Plus;

    if (highEducation > englandHighEducation) {
      baseGoals.push({
        id: 5,
        title: 'Establish Skills Sharing Program',
        target: 25,
        current: 8,
        deadline: '2025-05-01',
        category: 'Education',
        insight: `Utilize ${formatPercentage(highEducation)} higher education rate advantage`
      });
    }

    return baseGoals;
  };

  const [goals, setGoals] = useState(generateSmartGoals());

  const [newGoal, setNewGoal] = useState({
    title: '',
    target: '',
    deadline: '',
    category: 'Engagement'
  });

  const addGoal = () => {
    if (newGoal.title && newGoal.target && newGoal.deadline) {
      setGoals(prev => [...prev, {
        id: Date.now(),
        ...newGoal,
        current: 0,
        target: parseInt(newGoal.target)
      }]);
      setNewGoal({ title: '', target: '', deadline: '', category: 'Engagement' });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Set Goals</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Current Goals</h4>
        {goals.map(goal => (
          <Card key={goal.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{goal.title}</h5>
                  <p className="text-sm text-gray-600">{goal.category} • Due: {new Date(goal.deadline).toLocaleDateString()}</p>
                  {goal.insight && (
                    <p className="text-xs text-blue-600 mt-1">💡 {goal.insight}</p>
                  )}
                </div>
                <span className="text-sm font-medium" style={{ color: LAYER_CONFIG[layer]?.color }}>
                  {goal.current}/{goal.target}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((goal.current / goal.target) * 100, 100)}%`,
                      backgroundColor: LAYER_CONFIG[layer]?.color
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Community Strengths</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <div>🎓 Higher education: {formatPercentage(censusData.stoneclough.education.level4Plus)} vs {formatPercentage(censusData.england.education.level4Plus)} England avg</div>
          <div>💼 Young professionals: {formatPercentage(censusData.stoneclough.ageGroups['25-34'])} vs {formatPercentage(censusData.bolton.ageGroups['25-34'])} Bolton avg</div>
          <div>🏠 Home ownership: {formatPercentage(censusData.stoneclough.housing.owned)} vs {formatPercentage(censusData.england.housing.owned)} England avg</div>
        </div>
      </div>

      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Add New Goal</h4>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => {
              const suggestions = [
                { title: 'Engage Senior Citizens (65+)', target: 30, category: 'Demographics', reason: `Only ${formatPercentage(censusData.stoneclough.ageGroups['65+'])} vs ${formatPercentage(censusData.bolton.ageGroups['65+'])} Bolton avg` },
                { title: 'Support Young Families', target: 40, category: 'Demographics', reason: `${formatPercentage(censusData.stoneclough.ageGroups['35-49'])} family-age residents` },
                { title: 'Leverage High Education', target: 20, category: 'Education', reason: `${formatPercentage(censusData.stoneclough.education.level4Plus)} have higher education` }
              ];
              const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
              setNewGoal({
                title: suggestion.title,
                target: suggestion.target.toString(),
                deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                category: suggestion.category
              });
            }}
          >
            💡 Smart Suggest
          </Button>
        </div>
        <div>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
            placeholder="Goal title"
            value={newGoal.title}
            onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Target"
            value={newGoal.target}
            onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
          />
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={newGoal.deadline}
            onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={newGoal.category}
            onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
          >
            <option>Engagement</option>
            <option>Projects</option>
            <option>Events</option>
            <option>Economy</option>
          </select>
        </div>
        <Button
          size="sm"
          className="w-full text-xs"
          style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
          onClick={addGoal}
        >
          Add Goal
        </Button>
      </div>
    </div>
  );
}

// Commerce Layer Quick Actions
function ListItem({ layer, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Food & Produce',
    price: '',
    condition: 'New',
    description: '',
    location: 'Stoneclough',
    delivery: false,
    images: []
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>List Item</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="What are you selling?"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Food & Produce</option>
              <option>Crafts & Handmade</option>
              <option>Tools & Equipment</option>
              <option>Books & Media</option>
              <option>Clothing & Accessories</option>
              <option>Home & Garden</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="£0.00"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Describe your item..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
            >
              <option>New</option>
              <option>Like New</option>
              <option>Good</option>
              <option>Fair</option>
              <option>For Parts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="delivery"
            checked={formData.delivery}
            onChange={(e) => setFormData({...formData, delivery: e.target.checked})}
          />
          <label htmlFor="delivery" className="text-sm text-gray-700">Offer delivery</label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Save Draft</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            List Item
          </Button>
        </div>
      </div>
    </div>
  );
}

function OfferService({ layer, onClose }) {
  const [formData, setFormData] = useState({
    serviceName: '',
    category: 'Home Services',
    description: '',
    pricing: 'Hourly Rate',
    rate: '',
    availability: 'Weekdays',
    location: 'Local Only',
    experience: ''
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Offer Service</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="What service do you offer?"
            value={formData.serviceName}
            onChange={(e) => setFormData({...formData, serviceName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option>Home Services</option>
              <option>Garden & Landscaping</option>
              <option>Tutoring & Education</option>
              <option>Pet Care</option>
              <option>Technology Support</option>
              <option>Creative Services</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pricing Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.pricing}
              onChange={(e) => setFormData({...formData, pricing: e.target.value})}
            >
              <option>Hourly Rate</option>
              <option>Fixed Price</option>
              <option>Per Project</option>
              <option>Negotiable</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Describe your service and what's included..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="£0.00"
              value={formData.rate}
              onChange={(e) => setFormData({...formData, rate: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.availability}
              onChange={(e) => setFormData({...formData, availability: e.target.value})}
            >
              <option>Weekdays</option>
              <option>Weekends</option>
              <option>Evenings</option>
              <option>Flexible</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Experience & Qualifications</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-16"
            placeholder="Your relevant experience and qualifications..."
            value={formData.experience}
            onChange={(e) => setFormData({...formData, experience: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Save Draft</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Offer Service
          </Button>
        </div>
      </div>
    </div>
  );
}

// Economy Layer - Remaining Quick Actions
function OfferServices({ layer, onClose }) {
  const [formData, setFormData] = useState({
    serviceType: 'Professional Service',
    title: '',
    description: '',
    skills: '',
    experience: '',
    availability: 'Part-time',
    rate: '',
    location: 'Local Only'
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Offer Services</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="What service do you offer?"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.serviceType}
              onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
            >
              <option>Professional Service</option>
              <option>Consulting</option>
              <option>Teaching/Training</option>
              <option>Creative Services</option>
              <option>Technical Support</option>
              <option>Personal Services</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.availability}
              onChange={(e) => setFormData({...formData, availability: e.target.value})}
            >
              <option>Part-time</option>
              <option>Full-time</option>
              <option>Project-based</option>
              <option>Flexible</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Describe your service offering..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Key Skills</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="e.g., Marketing, Design, Analysis"
              value={formData.skills}
              onChange={(e) => setFormData({...formData, skills: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="£25/hour or £500/project"
              value={formData.rate}
              onChange={(e) => setFormData({...formData, rate: e.target.value})}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Save Draft</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Offer Services
          </Button>
        </div>
      </div>
    </div>
  );
}

function RequestSupport({ layer, onClose }) {
  const [formData, setFormData] = useState({
    supportType: 'Business Advice',
    title: '',
    description: '',
    urgency: 'Medium',
    budget: '',
    timeline: '1 month',
    preferredFormat: 'In-person'
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Request Support</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Support Request Title</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="What support do you need?"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Support Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.supportType}
              onChange={(e) => setFormData({...formData, supportType: e.target.value})}
            >
              <option>Business Advice</option>
              <option>Financial Planning</option>
              <option>Marketing Help</option>
              <option>Technical Support</option>
              <option>Legal Guidance</option>
              <option>Mentorship</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.urgency}
              onChange={(e) => setFormData({...formData, urgency: e.target.value})}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Describe your situation and what kind of support would be most helpful..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="£0 - £500 or Pro Bono"
              value={formData.budget}
              onChange={(e) => setFormData({...formData, budget: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.timeline}
              onChange={(e) => setFormData({...formData, timeline: e.target.value})}
            >
              <option>ASAP</option>
              <option>1 week</option>
              <option>1 month</option>
              <option>3 months</option>
              <option>Flexible</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Save Draft</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Request Support
          </Button>
        </div>
      </div>
    </div>
  );
}

// Works Layer - Remaining Quick Actions
function DonateResources({ layer, onClose }) {
  const [formData, setFormData] = useState({
    resourceType: 'Tools & Equipment',
    itemName: '',
    condition: 'Good',
    quantity: '1',
    description: '',
    availability: 'Available Now',
    location: 'Stoneclough',
    contactMethod: 'Platform Message'
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Donate Resources</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="What are you donating?"
            value={formData.itemName}
            onChange={(e) => setFormData({...formData, itemName: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.resourceType}
              onChange={(e) => setFormData({...formData, resourceType: e.target.value})}
            >
              <option>Tools & Equipment</option>
              <option>Materials & Supplies</option>
              <option>Furniture</option>
              <option>Technology</option>
              <option>Books & Educational</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.condition}
              onChange={(e) => setFormData({...formData, condition: e.target.value})}
            >
              <option>Excellent</option>
              <option>Good</option>
              <option>Fair</option>
              <option>Needs Repair</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
            placeholder="Describe the resource and any special notes..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={formData.availability}
              onChange={(e) => setFormData({...formData, availability: e.target.value})}
            >
              <option>Available Now</option>
              <option>Available This Week</option>
              <option>Available Next Week</option>
              <option>Flexible</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Save Draft</Button>
          <Button style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
            Donate Resource
          </Button>
        </div>
      </div>
    </div>
  );
}

function TrackProgress({ layer, onClose }) {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([
    { id: 1, name: "Community Garden Expansion", progress: 75, milestones: 8, completed: 6, nextMilestone: "Install irrigation system", dueDate: "2025-02-15" },
    { id: 2, name: "Playground Renovation", progress: 45, milestones: 6, completed: 3, nextMilestone: "Paint equipment", dueDate: "2025-01-20" },
    { id: 3, name: "Village Hall Repairs", progress: 90, milestones: 10, completed: 9, nextMilestone: "Final inspection", dueDate: "2025-01-10" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Track Progress</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {projects.map(project => (
          <Card
            key={project.id}
            className={`p-3 cursor-pointer transition-all ${
              selectedProject === project.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedProject(selectedProject === project.id ? null : project.id)}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <p className="text-sm text-gray-600">
                    {project.completed}/{project.milestones} milestones completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                    {project.progress}%
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: LAYER_CONFIG[layer]?.color
                    }}
                  />
                </div>
              </div>

              {selectedProject === project.id && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-sm">Next Milestone</h5>
                    <p className="text-sm text-gray-600">{project.nextMilestone}</p>
                    <p className="text-xs text-gray-500">Due: {new Date(project.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" className="text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                      Update Progress
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      View Details
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Pulse Layer - Remaining Quick Actions
function TrackKPIs({ layer, onClose }) {
  const [kpis, setKpis] = useState([
    { id: 1, name: 'Community Engagement Rate', current: 73, target: 80, trend: 'up', change: '+5%' },
    { id: 2, name: 'Active Project Completion', current: 85, target: 90, trend: 'up', change: '+8%' },
    { id: 3, name: 'Event Attendance Rate', current: 68, target: 75, trend: 'stable', change: '0%' },
    { id: 4, name: 'Local Business Growth', current: 12, target: 15, trend: 'up', change: '+3' }
  ]);

  const [newKPI, setNewKPI] = useState({
    name: '',
    target: '',
    category: 'Engagement'
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Track KPIs</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {kpis.map(kpi => (
          <Card key={kpi.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                  <p className="text-sm text-gray-600">Target: {kpi.target}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                    {kpi.current}
                  </div>
                  <div className={`text-xs flex items-center gap-1 ${
                    kpi.trend === 'up' ? 'text-green-600' :
                    kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    <span>{kpi.trend === 'up' ? '↗️' : kpi.trend === 'down' ? '↘️' : '➡️'}</span>
                    {kpi.change}
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%`,
                    backgroundColor: LAYER_CONFIG[layer]?.color
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-medium">Add New KPI</h4>
        <div>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mb-2"
            placeholder="KPI name"
            value={newKPI.name}
            onChange={(e) => setNewKPI({...newKPI, name: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="Target value"
            value={newKPI.target}
            onChange={(e) => setNewKPI({...newKPI, target: e.target.value})}
          />
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={newKPI.category}
            onChange={(e) => setNewKPI({...newKPI, category: e.target.value})}
          >
            <option>Engagement</option>
            <option>Projects</option>
            <option>Economy</option>
            <option>Events</option>
          </select>
        </div>
        <Button
          size="sm"
          className="w-full text-xs"
          style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
        >
          Add KPI
        </Button>
      </div>
    </div>
  );
}

function GenerateInsights({ layer, onClose }) {
  const [insightType, setInsightType] = useState('Community Trends');
  const [timeframe, setTimeframe] = useState('Last 30 Days');

  // Generate insights based on census data and community patterns
  const generateCensusInsights = () => {
    const communityInsights = getCommunityInsights();
    const behavioralInsights = [
      {
        title: "Weekend Engagement Peak",
        description: "Community engagement rates are 23% higher on weekends, particularly Saturday afternoons.",
        impact: "High",
        recommendation: "Schedule more community events on Saturday afternoons to maximize participation."
      },
      {
        title: "Young Professional Opportunity",
        description: `With ${formatPercentage(censusData.stoneclough.ageGroups['25-34'])} young professionals vs ${formatPercentage(censusData.bolton.ageGroups['25-34'])} in Bolton, there's untapped potential.`,
        impact: "High",
        recommendation: "Create networking events and career development programs targeting 25-34 age group."
      },
      {
        title: "High Education Advantage",
        description: `${formatPercentage(censusData.stoneclough.education.level4Plus)} of residents have higher education vs ${formatPercentage(censusData.england.education.level4Plus)} England average.`,
        impact: "Medium",
        recommendation: "Leverage high education levels for knowledge sharing, mentorship, and skill-based volunteering."
      }
    ];
    return [...communityInsights.map(insight => ({
      title: insight.category + " Advantage",
      description: insight.insight,
      impact: insight.impact === 'Positive' ? 'High' : 'Medium',
      recommendation: insight.recommendation
    })), ...behavioralInsights];
  };

  const [insights, setInsights] = useState(generateCensusInsights());

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Generate Insights</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Insight Type</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={insightType}
            onChange={(e) => setInsightType(e.target.value)}
          >
            <option>Community Trends</option>
            <option>Demographic Insights</option>
            <option>Participation Patterns</option>
            <option>Comparative Analysis</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <Card key={index} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  insight.impact === 'High' ? 'bg-red-100 text-red-800' :
                  insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {insight.impact} Impact
                </span>
              </div>
              <p className="text-sm text-gray-600">{insight.description}</p>
              <div className="p-2 bg-blue-50 rounded text-sm">
                <strong>Recommendation:</strong> {insight.recommendation}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Generate New Insights
      </Button>
    </div>
  );
}

// Demographic Comparison Component
function DemographicComparison({ layer, onClose }) {
  const [selectedMetric, setSelectedMetric] = useState('ageGroups');
  const [selectedCategory, setSelectedCategory] = useState('25-34');

  const metricOptions = {
    ageGroups: { label: 'Age Groups', categories: ['0-15', '16-24', '25-34', '35-49', '50-64', '65+'] },
    employment: { label: 'Employment', categories: ['employed', 'unemployed', 'inactive'] },
    education: { label: 'Education', categories: ['noQualifications', 'level1', 'level2', 'level3', 'level4Plus'] },
    housing: { label: 'Housing', categories: ['owned', 'socialRented', 'privateRented'] },
    ethnicity: { label: 'Ethnicity', categories: ['white', 'asian', 'black', 'mixed'] }
  };

  const comparisonData = getDemographicComparison(selectedMetric, selectedCategory);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Community Demographics</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={selectedMetric}
            onChange={(e) => {
              setSelectedMetric(e.target.value);
              setSelectedCategory(metricOptions[e.target.value].categories[0]);
            }}
          >
            {Object.entries(metricOptions).map(([key, option]) => (
              <option key={key} value={key}>{option.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {metricOptions[selectedMetric].categories.map(category => (
              <option key={category} value={category}>
                {category.replace(/([A-Z])/g, ' $1').replace(/^\w/, c => c.toUpperCase())}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {comparisonData.map((area, index) => (
          <Card key={area.area} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{area.area}</h4>
                <p className="text-sm text-gray-600">Population: {formatPopulation(area.population)}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{
                  color: index === 0 ? LAYER_CONFIG[layer]?.color : '#6B7280'
                }}>
                  {formatPercentage(area.value)}
                </div>
                {index === 0 && (
                  <div className="text-xs text-blue-600 font-medium">Our Community</div>
                )}
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(area.value / Math.max(...comparisonData.map(d => d.value))) * 100}%`,
                    backgroundColor: index === 0 ? LAYER_CONFIG[layer]?.color : '#9CA3AF'
                  }}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="p-3 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-1">Community Insight</h4>
        <p className="text-sm text-blue-800">
          {comparisonData[0].value > comparisonData[1].value
            ? `Stoneclough has a ${((comparisonData[0].value - comparisonData[1].value)).toFixed(1)}% higher rate than Bolton average.`
            : `Stoneclough has a ${((comparisonData[1].value - comparisonData[0].value)).toFixed(1)}% lower rate than Bolton average.`
          }
        </p>
      </div>
    </div>
  );
}

// Commerce Layer - Remaining Quick Actions
function MakePurchase({ layer, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [items, setItems] = useState([
    { id: 1, title: "Fresh Vegetables Box", seller: "Green Valley Farm", price: "£15", category: "Food", image: "🥕", inStock: true },
    { id: 2, title: "Handmade Pottery Set", seller: "Local Crafts Co.", price: "£25", category: "Crafts", image: "🏺", inStock: true },
    { id: 3, title: "Local Honey Jar", seller: "Bee Happy Farm", price: "£8", category: "Food", image: "🍯", inStock: false },
    { id: 4, title: "Knitted Scarf", seller: "Cozy Creations", price: "£12", category: "Clothing", image: "🧣", inStock: true }
  ]);

  const filteredItems = items.filter(item =>
    (category === 'All Categories' || item.category === category) &&
    (searchTerm === '' || item.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Make Purchase</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>All Categories</option>
          <option>Food</option>
          <option>Crafts</option>
          <option>Clothing</option>
          <option>Tools</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredItems.map(item => (
          <Card key={item.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{item.image}</div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.title}</h4>
                <p className="text-sm text-gray-600">by {item.seller}</p>
                <p className="text-xs text-gray-500">{item.category}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                  {item.price}
                </div>
                <Button
                  size="sm"
                  className="text-xs mt-1"
                  disabled={!item.inStock}
                  style={{ backgroundColor: item.inStock ? LAYER_CONFIG[layer]?.color : '#gray' }}
                >
                  {item.inStock ? 'Buy Now' : 'Out of Stock'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-medium">No items found</p>
          <p className="text-sm">Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  );
}

function JoinNetwork({ layer, onClose }) {
  const [networks, setNetworks] = useState([
    { id: 1, name: "Local Producers Network", members: 45, category: "Agriculture", description: "Connect with local farmers and food producers", joined: false },
    { id: 2, name: "Artisan Collective", members: 28, category: "Crafts", description: "Community of local artists and craftspeople", joined: true },
    { id: 3, name: "Service Providers Guild", members: 67, category: "Services", description: "Professional services network for mutual support", joined: false },
    { id: 4, name: "Sustainable Living Group", members: 89, category: "Environment", description: "Promoting eco-friendly practices and products", joined: false }
  ]);

  const joinNetwork = (networkId) => {
    setNetworks(prev => prev.map(network =>
      network.id === networkId
        ? { ...network, joined: true, members: network.members + 1 }
        : network
    ));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Join Network</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="space-y-3">
        {networks.map(network => (
          <Card key={network.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{network.name}</h4>
                  <p className="text-sm text-gray-600">{network.description}</p>
                  <p className="text-xs text-gray-500">{network.members} members • {network.category}</p>
                </div>
                {network.joined && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    Joined
                  </span>
                )}
              </div>

              {!network.joined ? (
                <Button
                  size="sm"
                  className="w-full text-xs"
                  style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
                  onClick={() => joinNetwork(network.id)}
                >
                  Join Network
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    View Members
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    Network Chat
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="p-3 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Create New Network</h4>
        <p className="text-sm text-gray-600 mb-3">Don't see a network that fits your needs? Start your own!</p>
        <Button
          size="sm"
          className="w-full text-xs"
          style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
        >
          Create Network
        </Button>
      </div>
    </div>
  );
}

// Quick Action Renderer Function
function renderQuickAction(action, layer, onClose) {
  const actionComponents = {
    'Faith': {
      'Schedule Service': () => <ScheduleService layer={layer} onClose={onClose} />,
      'Create Event': () => <CreateEvent layer={layer} onClose={onClose} />,
      'Join Ministry': () => <JoinMinistry layer={layer} onClose={onClose} />,
      'Share Testimony': () => <ShareTestimony layer={layer} onClose={onClose} />
    },
    'Economy': {
      'List Business': () => <ListBusiness layer={layer} onClose={onClose} />,
      'Find Mentor': () => <FindMentor layer={layer} onClose={onClose} />,
      'Offer Services': () => <OfferServices layer={layer} onClose={onClose} />,
      'Request Support': () => <RequestSupport layer={layer} onClose={onClose} />
    },
    'Works': {
      'Start Project': () => <StartProject layer={layer} onClose={onClose} />,
      'Join Team': () => <JoinTeam layer={layer} onClose={onClose} />,
      'Donate Resources': () => <DonateResources layer={layer} onClose={onClose} />,
      'Track Progress': () => <TrackProgress layer={layer} onClose={onClose} />
    },
    'Circle': {
      'Create Proposal': () => <CreateProposal layer={layer} onClose={onClose} />,
      'Cast Vote': () => <CastVote layer={layer} onClose={onClose} />,
      'Join Discussion': () => <JoinDiscussion layer={layer} onClose={onClose} />,
      'View Results': () => <ViewResults layer={layer} onClose={onClose} />
    },
    'Mind': {
      'Start Course': () => <StartCourse layer={layer} onClose={onClose} />,
      'Share Knowledge': () => <ShareKnowledge layer={layer} onClose={onClose} />,
      'Ask SILAS': () => <AskSILAS layer={layer} onClose={onClose} />,
      'Find Tutor': () => <FindTutor layer={layer} onClose={onClose} />
    },
    'Pulse': {
      'View Reports': () => <ViewReports layer={layer} onClose={onClose} />,
      'Set Goals': () => <SetGoals layer={layer} onClose={onClose} />,
      'Track KPIs': () => <TrackKPIs layer={layer} onClose={onClose} />,
      'Generate Insights': () => <GenerateInsights layer={layer} onClose={onClose} />
    },
    'Commerce': {
      'List Item': () => <ListItem layer={layer} onClose={onClose} />,
      'Offer Service': () => <OfferService layer={layer} onClose={onClose} />,
      'Make Purchase': () => <MakePurchase layer={layer} onClose={onClose} />,
      'Join Network': () => <JoinNetwork layer={layer} onClose={onClose} />
    }
  };

  const layerActions = actionComponents[layer];
  if (layerActions && layerActions[action]) {
    return layerActions[action]();
  }

  // Default action placeholder for actions not yet implemented
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>{action}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">⚡</div>
        <p className="font-medium">Quick Action</p>
        <p className="text-sm">This action is under development</p>
      </div>
    </div>
  );
}

function PageOverlay({ layer, onClose, onFlyTo, onSelectFeature, onShowMetrics, onPinAction, onVote }) {
  const Icon = LAYER_CONFIG[layer]?.icon;
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTool, setActiveTool] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  const layerDetails = {
    Faith: {
      title: 'Faith & Culture',
      description: 'Community spiritual life, cultural events, and gatherings',
      tools: ['Event Calendar', 'Prayer Requests', 'Community Outreach', 'Volunteer Coordination'],
      actions: ['Schedule Service', 'Create Event', 'Join Ministry', 'Share Testimony']
    },
    Economy: {
      title: 'Local Economy',
      description: 'Supporting local businesses and economic development',
      tools: ['Business Directory', 'Economic Indicators', 'Investment Opportunities', 'Skills Exchange'],
      actions: ['List Business', 'Find Mentor', 'Offer Services', 'Request Support']
    },
    Works: {
      title: 'Community Projects',
      description: 'Active and proposed community improvement projects',
      tools: ['Project Tracker', 'Resource Manager', 'Volunteer Hub', 'Progress Dashboard'],
      actions: ['Start Project', 'Join Team', 'Donate Resources', 'Track Progress']
    },
    Circle: {
      title: 'Governance & Proposals',
      description: 'Community decisions, proposals, and civic engagement',
      tools: ['Voting System', 'Proposal Builder', 'Discussion Forums', 'Decision Archive'],
      actions: ['Create Proposal', 'Cast Vote', 'Join Discussion', 'View Results']
    },
    Mind: {
      title: 'Learning & Knowledge',
      description: 'Educational resources, skills sharing, and AI assistance',
      tools: ['Learning Paths', 'Skill Matcher', 'AI Assistant', 'Knowledge Base'],
      actions: ['Start Course', 'Share Knowledge', 'Ask SILAS', 'Find Tutor']
    },
    Pulse: {
      title: 'Community Data & KPIs',
      description: 'Tracking community health, engagement, and progress metrics',
      tools: ['Analytics Dashboard', 'Health Metrics', 'Demographics Comparison', 'Trend Analysis'],
      actions: ['View Reports', 'Set Goals', 'Track KPIs', 'Generate Insights']
    },
    Commerce: {
      title: 'Local Commerce',
      description: 'Local marketplace, services, and business connections',
      tools: ['Marketplace', 'Service Directory', 'Local Currency', 'Trade Network'],
      actions: ['List Item', 'Offer Service', 'Make Purchase', 'Join Network']
    },
  }[layer] || { title: layer, description: 'Layer content', tools: [], actions: [] };

  useEffect(() => {
    const fetchLayerPosts = async () => {
      if (!layer) return;
      setIsLoading(true);
      try {
        const layerPins = await supabaseHelpers.getPins(layer);
        setPosts(layerPins);
      } catch (error) {
        console.error(`Error fetching posts for layer ${layer}:`, error);
        setPosts([]);
      }
      setIsLoading(false);
    };

    fetchLayerPosts();
  }, [layer]);

  const handlePostClick = (post) => {
    const feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: post.coordinates },
      properties: post
    };
    onSelectFeature(feature);
    onClose();
  };

  // If a tool is active, show the tool content
  if (activeTool) {
    return (
      <div className="h-full flex flex-col">
        {renderTool(activeTool, layer, () => setActiveTool(null))}
      </div>
    );
  }

  // If a quick action is active, show the action content
  if (activeAction) {
    return (
      <div className="h-full flex flex-col">
        {renderQuickAction(activeAction, layer, () => setActiveAction(null))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b" style={{ borderColor: LAYER_CONFIG[layer]?.color }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {Icon && <Icon size={24} style={{ color: LAYER_CONFIG[layer]?.color }} />}
            <h2 className="text-xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>{layerDetails.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowMetrics(layer)}
              className="text-xs"
              style={{ borderColor: LAYER_CONFIG[layer]?.color, color: LAYER_CONFIG[layer]?.color }}
            >
              <TrendingUp size={14} className="mr-1" />
              Metrics
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">{layerDetails.description}</p>

        {/* Category Tools */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            {layerDetails.tools.map((tool, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs justify-start hover:shadow-md transition-all"
                style={{ borderColor: LAYER_CONFIG[layer]?.color + '40', color: LAYER_CONFIG[layer]?.color }}
                onClick={() => setActiveTool(tool)}
              >
                {tool}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            {layerDetails.actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                className="text-xs justify-start hover:shadow-md transition-all"
                style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
                onClick={() => setActiveAction(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-500">No items found for this layer yet.</p>
        ) : (
          posts.map((post) => {
            const progress = post.layer === 'Works' && post.projects && post.projects.length > 0 ? post.projects[0].progress : null;
            return (
              <Card key={post.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handlePostClick(post)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 flex-1 pr-2">{post.name}</h3>
                    {progress !== null && (
                      <div className="text-xs px-2 py-1 rounded-full" 
                        style={{ backgroundColor: `${LAYER_CONFIG[layer]?.color}20`, color: LAYER_CONFIG[layer]?.color }}>
                        {progress}% complete
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{post.description}</p>
                  
                  {progress !== null && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${progress}%`, 
                            backgroundColor: LAYER_CONFIG[layer]?.color 
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><ThumbsUp size={12} /> {post.feedback[0]?.count || 0}</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments[0]?.count || 0}</span>
                    </div>
                    <div className="flex gap-2">
                      {layer === 'Works' && (
                        <Button
                          size="sm"
                          variant="outline"
                          style={{ borderColor: LAYER_CONFIG[layer]?.color, color: LAYER_CONFIG[layer]?.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinAction(post.id, 'join_project', layer);
                          }}
                        >
                          Join
                        </Button>
                      )}
                      {layer === 'Circle' && (
                        <Button
                          size="sm"
                          variant="outline"
                          style={{ borderColor: LAYER_CONFIG[layer]?.color, color: LAYER_CONFIG[layer]?.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinAction(post.id, 'vote_on_proposal', layer);
                          }}
                        >
                          Vote
                        </Button>
                      )}
                      {layer === 'Faith' && (
                        <Button
                          size="sm"
                          variant="outline"
                          style={{ borderColor: LAYER_CONFIG[layer]?.color, color: LAYER_CONFIG[layer]?.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinAction(post.id, 'follow_faith', layer);
                          }}
                        >
                          Follow
                        </Button>
                      )}
                      {(layer === 'Economy' || layer === 'Commerce') && (
                        <Button
                          size="sm"
                          variant="outline"
                          style={{ borderColor: LAYER_CONFIG[layer]?.color, color: LAYER_CONFIG[layer]?.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onPinAction(post.id, 'endorse_business', layer);
                          }}
                        >
                          Endorse
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVote(post.id);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <ThumbsUp size={12} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

// Social Feed Component
function SocialFeedContent({ pins, activeLayer, onItemClick }) {
  const [sortBy, setSortBy] = useState("recent");

  const getLayerAction = (layer) => {
    const actions = {
      'Faith': 'Community Gathering',
      'Economy': 'Business Update',
      'Commerce': 'New Service',
      'Works': 'Project Progress',
      'Circle': 'Proposal Discussion',
      'Mind': 'Learning Resource',
      'Pulse': 'Data Update'
    };
    return actions[layer] || 'Update';
  };

  const feedItems = useMemo(() => {
    const items = pins.map(pin => ({
      id: pin.id,
      type: pin.layer?.toLowerCase() || 'general',
      title: `${pin.name} - ${getLayerAction(pin.layer)}`,
      excerpt: pin.description || "No description available",
      coords: pin.coordinates,
      featureName: pin.name,
      layer: pin.layer,
      reactions: pin.feedback?.[0]?.count || 0,
      comments: pin.comments?.[0]?.count || 0,
      created_at: pin.created_at,
      recent_activity: pin.updated_at || pin.created_at
    }));

    const sorted = items.sort((a, b) => {
      if (sortBy === "trending") {
        return (b.reactions + b.comments) - (a.reactions + a.comments);
      }
      return new Date(b.recent_activity) - new Date(a.recent_activity);
    });

    const filtered = activeLayer === "All"
      ? sorted
      : sorted.filter(item => item.layer === activeLayer);

    return filtered.slice(0, 10);
  }, [pins, activeLayer, sortBy]);

  return { feedItems, sortBy, setSortBy };
}

// Social Feed Modal Component
function SocialFeedModal({ pins, activeLayer, onItemClick }) {
  const { feedItems, sortBy, setSortBy } = SocialFeedContent({ pins, activeLayer, onItemClick });

  return (
    <Card className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[600px] max-h-[calc(100vh-140px)] overflow-y-auto bg-white/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-top-4 duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2" style={{ color: LAYER_CONFIG[activeLayer]?.color }}>
            <MessageCircle size={20} />
            Community Feed {activeLayer !== "All" && `- ${activeLayer}`}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={sortBy === "recent" ? "default" : "outline"}
              onClick={() => setSortBy("recent")}
              className="text-xs"
            >
              Recent
            </Button>
            <Button
              size="sm"
              variant={sortBy === "trending" ? "default" : "outline"}
              onClick={() => setSortBy("trending")}
              className="text-xs"
            >
              Trending
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {feedItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
              <div className="font-medium">No posts yet</div>
              <div className="text-sm">Be the first to add content to this layer!</div>
            </div>
          ) : (
            feedItems.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => onItemClick(item)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">{item.title}</div>
                    <div className="text-sm text-gray-600 mb-2 line-clamp-2">{item.excerpt}</div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin size={12} />{item.featureName}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={12} />{item.reactions} reactions</span>
                      <span className="flex items-center gap-1"><MessageCircle size={12} />{item.comments} comments</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LAYER_CONFIG[item.layer]?.color }} />
                    <div className="text-xs text-gray-400">
                      {new Date(item.recent_activity).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Faith Layer Tools
function EventCalendar({ layer, onClose }) {
  const [events, setEvents] = useState([
    { id: 1, title: "Sunday Service", date: "2025-01-12", time: "10:00 AM", location: "Community Center", attendees: 45 },
    { id: 2, title: "Prayer Circle", date: "2025-01-15", time: "7:00 PM", location: "Parish Hall", attendees: 12 },
    { id: 3, title: "Community Outreach", date: "2025-01-18", time: "2:00 PM", location: "Town Square", attendees: 28 }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Event Calendar</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        <Church size={16} className="mr-2" />
        Schedule New Event
      </Button>

      <div className="space-y-3">
        {events.map(event => (
          <Card key={event.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{event.title}</h4>
                <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                <p className="text-xs text-gray-500">{event.location}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium" style={{ color: LAYER_CONFIG[layer]?.color }}>
                  {event.attendees} attending
                </div>
                <Button size="sm" variant="outline" className="mt-1 text-xs">Join</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PrayerRequests({ layer, onClose }) {
  const [requests, setRequests] = useState([
    { id: 1, request: "Healing for Mrs. Johnson", author: "Anonymous", prayers: 23, date: "2 days ago" },
    { id: 2, request: "Safe travels for the youth group", author: "Pastor Mike", prayers: 15, date: "1 day ago" },
    { id: 3, request: "Community unity and peace", author: "Sarah M.", prayers: 31, date: "3 hours ago" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Prayer Requests</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Submit Prayer Request
      </Button>

      <div className="space-y-3">
        {requests.map(request => (
          <Card key={request.id} className="p-3">
            <div className="space-y-2">
              <p className="text-sm text-gray-800">{request.request}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>by {request.author} • {request.date}</span>
                <div className="flex items-center gap-2">
                  <span>{request.prayers} prayers</span>
                  <Button size="sm" variant="outline" className="text-xs px-2 py-1">
                    🙏 Pray
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CommunityOutreach({ layer, onClose }) {
  const [programs, setPrograms] = useState([
    { id: 1, name: "Food Bank", description: "Weekly food distribution", volunteers: 12, nextDate: "Saturday 9 AM" },
    { id: 2, name: "Elderly Care", description: "Visiting and assistance", volunteers: 8, nextDate: "Sunday 2 PM" },
    { id: 3, name: "Youth Mentoring", description: "After-school programs", volunteers: 15, nextDate: "Weekdays 4 PM" }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Community Outreach</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
        Start New Program
      </Button>

      <div className="space-y-3">
        {programs.map(program => (
          <Card key={program.id} className="p-3">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">{program.name}</h4>
              <p className="text-sm text-gray-600">{program.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {program.volunteers} volunteers • Next: {program.nextDate}
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  Volunteer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VolunteerCoordination({ layer, onClose }) {
  const [opportunities, setOpportunities] = useState([
    { id: 1, role: "Sunday School Teacher", commitment: "Weekly", skills: "Teaching, Patience", spots: 2 },
    { id: 2, role: "Music Ministry", commitment: "Bi-weekly", skills: "Musical ability", spots: 3 },
    { id: 3, role: "Community Garden", commitment: "Monthly", skills: "Gardening", spots: 5 }
  ]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg" style={{ color: LAYER_CONFIG[layer]?.color }}>Volunteer Coordination</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={16} /></Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="text-xs">My Commitments</Button>
        <Button className="text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
          Post Opportunity
        </Button>
      </div>

      <div className="space-y-3">
        {opportunities.map(opportunity => (
          <Card key={opportunity.id} className="p-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{opportunity.role}</h4>
                  <p className="text-xs text-gray-600">Commitment: {opportunity.commitment}</p>
                  <p className="text-xs text-gray-500">Skills: {opportunity.skills}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium" style={{ color: LAYER_CONFIG[layer]?.color }}>
                    {opportunity.spots} spots
                  </div>
                  <Button size="sm" className="mt-1 text-xs" style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Community Metrics Dashboard Component
function CommunityMetrics({ layer, onClose }) {
  const [metrics, setMetrics] = useState({
    totalPins: 5,
    totalFeedback: 12,
    totalComments: 8,
    recentActivity: 3,
    layerBreakdown: {
      Faith: { pins: 1, feedback: 3, comments: 2 },
      Commerce: { pins: 1, feedback: 2, comments: 1 },
      Works: { pins: 1, feedback: 4, comments: 3 },
      Circle: { pins: 1, feedback: 2, comments: 1 },
      Mind: { pins: 1, feedback: 1, comments: 1 }
    }
  });
  const [vitality, setVitality] = useState({
    dailyActivity: 2,
    weeklyActivity: 8,
    vitality: 75
  });
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: LAYER_CONFIG[layer]?.color }}>
          {layer === 'All' ? 'Community Overview' : `${layer} Metrics`}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>

      {vitality && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-3">Community Vitality</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Health</span>
                <span>{vitality.vitality}%</span>
              </div>
              <Progress value={vitality.vitality} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Daily Activity</div>
                <div className="font-semibold">{vitality.dailyActivity}</div>
              </div>
              <div>
                <div className="text-gray-600">Weekly Activity</div>
                <div className="font-semibold">{vitality.weeklyActivity}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                {metrics.totalPins}
              </div>
              <div className="text-xs text-gray-600">Total Pins</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                {metrics.totalFeedback}
              </div>
              <div className="text-xs text-gray-600">Reactions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG[layer]?.color }}>
                {metrics.totalComments}
              </div>
              <div className="text-xs text-gray-600">Comments</div>
            </div>
          </div>

          {layer === 'All' && (
            <div>
              <h4 className="font-medium mb-3">Layer Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(metrics.layerBreakdown).map(([layerName, data]) => (
                  <div key={layerName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: LAYER_CONFIG[layerName]?.color }}></div>
                      <span className="text-sm font-medium">{layerName}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {data.pins} pins • {data.feedback} reactions
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main SILAS Platform Component
export default function SilasPlatform() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [viewMode, setViewMode] = useState("map");
  const [openPage, setOpenPage] = useState(null);
  const [activeLayer, setActiveLayer] = useState("All");
  const [feedback, setFeedback] = useState({});
  const [commentText, setCommentText] = useState("");
  const [showPinCreation, setShowPinCreation] = useState(null);
  const [showDataInspector, setShowDataInspector] = useState(null);
  const [showCopilot, setShowCopilot] = useState(null);
  const [mapData, setMapData] = useState({ type: "FeatureCollection", features: [] });
  const [socialFeedPins, setSocialFeedPins] = useState([]);
  const [showMetrics, setShowMetrics] = useState(null);
  const [boundsWarning, setBoundsWarning] = useState(null);

  const geojsonPath = "/data/stoneclough_1759579511516.geojson";
  const csvPath = "/data/custom_area_data_1759579511516.csv";
  const kmlPath = "/data/stoneclough.kml";

  const mapApiRef = useRef(null);

  const loadAllData = useCallback(async () => {
    try {
      const [geoRes, csvRes] = await Promise.all([fetch(geojsonPath), fetch(csvPath)]);
      const geoData = await geoRes.json();
      const csvText = await csvRes.text();
      const parsedCsv = Papa.parse(csvText, { header: true }).data;

      geoData.features.forEach((feature) => {
        const fname = String(feature.properties?.name || feature.properties?.id || "").trim();
        const match = parsedCsv.find((row) => String(row.name || row.id || "").trim() === fname);
        if (match) feature.properties = { ...feature.properties, ...match };
        feature.properties.id = feature.properties.id || feature.id || feature.properties?.name;
        if (!feature.properties.layer && feature.properties.tags) {
          const tags = String(feature.properties.tags).split(",").map((t) => t.trim());
          const found = tags.find((t) => Object.keys(LAYER_CONFIG).includes(capitalize(t)));
          if (found) feature.properties.layer = capitalize(found);
        }
      });

      const supabasePins = await supabaseHelpers.getPins();
      const supabaseFeatures = supabasePins.map(pin => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: pin.coordinates },
        properties: {
          ...pin,
          reactions: pin.feedback[0]?.count || 0,
          comments: pin.comments[0]?.count || 0,
          isDynamic: true,
        }
      }));

      const existingStaticIds = new Set(supabaseFeatures.map(f => f.properties.name));
      const filteredStaticFeatures = geoData.features.filter(f => !existingStaticIds.has(f.properties.name));
      
      const combinedFeatures = [...filteredStaticFeatures, ...supabaseFeatures];
      setMapData({ type: "FeatureCollection", features: combinedFeatures });

      // Update social feed data
      setSocialFeedPins(supabasePins);

    } catch (error) {
      console.error("Error loading map data:", error);
    }
  }, [geojsonPath, csvPath]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleVote = async (id) => {
    try {
      await supabaseHelpers.addFeedback(id, 'like', 'anonymous');
      await supabaseHelpers.logActivity('feedback_given', { pin_id: id, type: 'like' });
      loadAllData();
    } catch (error) {
      console.error('Error adding feedback:', error);
    }
  };

  const handleComment = async (id) => {
    if (!commentText.trim()) return;
    try {
      await supabaseHelpers.addComment(id, commentText, 'anonymous');
      await supabaseHelpers.logActivity('comment_added', { pin_id: id, text: commentText });
      setCommentText("");
      loadAllData();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handlePinAction = async (pinId, actionType, layer) => {
    try {
      // Log the activity
      await supabaseHelpers.logActivity(actionType, { pin_id: pinId, layer: layer, action: actionType });

      // Add feedback based on action type
      if (['amen', 'endorse_business', 'join_project', 'vote_on_proposal'].includes(actionType)) {
        await supabaseHelpers.addFeedback(pinId, actionType, 'anonymous');
      }

      // Reload data to reflect changes
      loadAllData();

      // Show success feedback (you could replace with toast notification)
      console.log(`Action '${actionType}' completed for pin ${pinId}`);
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const openFeaturePage = (feature) => {
    setSelectedFeature(feature);
    const layerFromFeature = feature.properties?.layer || feature.properties?.type || null;
    if (layerFromFeature && Object.keys(LAYER_CONFIG).includes(layerFromFeature)) {
      setActiveLayer(layerFromFeature);
    }
  };

  const handleFeedItemClick = (item) => {
    if (mapApiRef.current && item.coords) {
      mapApiRef.current.flyToCoords(item.coords, 16);
    }
    setViewMode("map");
    if (item.layer) {
      setActiveLayer(item.layer);
    }
  };

  const handleRightClick = (lngLat, layer) => {
    setShowPinCreation({ lngLat, layer });
  };

  const handleCreatePin = async (pinData) => {
    try {
      const newPinData = {
        ...pinData,
        coords: showPinCreation.lngLat,
        category: showPinCreation.layer,
        userId: 'anonymous'
      };
      
      const createdPin = await supabaseHelpers.createPin(newPinData);
      await supabaseHelpers.logActivity('pin_created', { pin_id: createdPin.id, name: pinData.name });
      
      setShowPinCreation(null);
      loadAllData();
      
      console.log('Pin created successfully:', createdPin);
    } catch (error) {
      console.error('Error creating pin:', error);
    }
  };



  const LayerIcon = activeLayer ? LAYER_CONFIG[activeLayer]?.icon : Briefcase;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-100">
      <MapboxCentral
        mapData={mapData}
        kmlUrl={kmlPath}
        onSelect={openFeaturePage}
        mapApiRef={mapApiRef}
        activeLayer={activeLayer}
        onRightClick={handleRightClick}
        boundsWarning={boundsWarning}
        setBoundsWarning={setBoundsWarning}
      />

      {/* UI Components */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border-2 transition-all" style={{ borderColor: LAYER_CONFIG[activeLayer]?.color || LAYER_CONFIG.Economy.color }}>
        <img src={silasLogo} alt="SILAS" className="h-8 w-8 mr-3" />
        <div className="font-bold text-xl mr-6" style={{ color: LAYER_CONFIG[activeLayer]?.color || LAYER_CONFIG.Economy.color }}>SILAS</div>
        <div className="flex items-center gap-2 mr-6 bg-gray-100 rounded-full p-1">
          <button onClick={() => setViewMode("map")} className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${viewMode === "map" ? "bg-white shadow-md" : "bg-transparent text-gray-600"}`}>
            Map
          </button>
          <button onClick={() => setViewMode("social")} className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${viewMode === "social" ? "bg-white shadow-md" : "bg-transparent text-gray-600"}`}>
            Social
          </button>
        </div>
        <nav className="flex gap-2 text-sm">
          {Object.keys(LAYER_CONFIG).map((layer) => (
            <button
              key={layer}
              onClick={() => {
                if (activeLayer === layer && openPage === layer) {
                  // If clicking the same active layer with open page, close the page
                  setOpenPage(null);
                } else if (activeLayer === layer) {
                  // If clicking the same active layer without open page, open the page
                  setOpenPage(layer !== "All" ? layer : null);
                } else {
                  // If clicking a different layer, set it as active and open its page
                  setActiveLayer(layer);
                  setOpenPage(layer !== "All" ? layer : null);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                activeLayer === layer
                  ? openPage === layer
                    ? "shadow-lg text-white ring-2 ring-white/30"
                    : "shadow-md text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              style={activeLayer === layer ? { backgroundColor: LAYER_CONFIG[layer].color } : {}}
              title={layer !== "All" ? `View ${layer} layer and tools` : `View all layers`}
            >
              {React.createElement(LAYER_CONFIG[layer].icon, { size: 14 })}
              {layer}
            </button>
          ))}
        </nav>
      </header>

      {viewMode === "social" && (
        <SocialFeedModal
          pins={socialFeedPins}
          activeLayer={activeLayer}
          onItemClick={handleFeedItemClick}
        />
      )}

      {selectedFeature && viewMode === "map" && (
        <Card className="absolute top-24 right-6 z-30 w-[420px] bg-white/98 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-right-4 duration-300" style={{ borderColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
                <LayerIcon size={20} />
                {selectedFeature.properties?.name || "Untitled"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFeature(null)}><X size={16} /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 mb-4">{selectedFeature.properties?.description || "No description available."}</div>
            
            <div className="space-y-2 mb-4">
              {selectedFeature.properties?.layer === "Faith" && (
                <>
                  <Button className="w-full flex items-center justify-center gap-2" style={{ backgroundColor: LAYER_CONFIG.Faith.color }} onClick={() => handlePinAction(selectedFeature.properties.id, 'amen', 'Faith')}>
                    <Church size={16} />
                    Amen ({selectedFeature.properties?.feedback?.filter(f => f.type === 'amen')?.length || 0})
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handlePinAction(selectedFeature.properties.id, 'follow_faith', 'Faith')}>
                    <Users size={16} />
                    Follow Updates
                  </Button>
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                    Event details, service times, and community activities
                  </div>
                </>
              )}
              {(selectedFeature.properties?.layer === "Commerce" || selectedFeature.properties?.layer === "Economy") && (
                <>
                  <Button className="w-full flex items-center justify-center gap-2" style={{ backgroundColor: LAYER_CONFIG[selectedFeature.properties?.layer].color }} onClick={() => handlePinAction(selectedFeature.properties.id, 'endorse_business', selectedFeature.properties?.layer)}>
                    <ThumbsUp size={16} />
                    Endorse Business ({selectedFeature.properties?.feedback?.filter(f => f.type === 'endorse_business')?.length || 0})
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handlePinAction(selectedFeature.properties.id, 'request_mentorship', selectedFeature.properties?.layer)}>
                    <MessageCircle size={16} />
                    Request Mentorship
                  </Button>
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                    Support local business and connect with mentors
                  </div>
                </>
              )}
              {selectedFeature.properties?.layer === "Works" && (
                <>
                  <Button className="w-full flex items-center justify-center gap-2" style={{ backgroundColor: LAYER_CONFIG.Works.color }} onClick={() => handlePinAction(selectedFeature.properties.id, 'join_project', 'Works')}>
                    <Hammer size={16} />
                    Join Project ({selectedFeature.properties?.feedback?.filter(f => f.type === 'join_project')?.length || 0})
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handlePinAction(selectedFeature.properties.id, 'donate_materials', 'Works')}>
                    <Database size={16} />
                    Donate Materials
                  </Button>
                  {selectedFeature.properties?.projects?.[0]?.progress && (
                    <div className="mt-2 p-2 bg-gray-50 rounded">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Project Progress</span>
                        <span>{selectedFeature.properties.projects[0].progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ backgroundColor: LAYER_CONFIG.Works.color, width: `${selectedFeature.properties.projects[0].progress}%` }}></div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {selectedFeature.properties?.layer === "Circle" && (
                <>
                  <Button className="w-full flex items-center justify-center gap-2" style={{ backgroundColor: LAYER_CONFIG.Circle.color }} onClick={() => handlePinAction(selectedFeature.properties.id, 'vote_on_proposal', 'Circle')}>
                    <Users size={16} />
                    Vote ({selectedFeature.properties?.feedback?.filter(f => f.type === 'vote_on_proposal')?.length || 0})
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handlePinAction(selectedFeature.properties.id, 'discuss_proposal', 'Circle')}>
                    <MessageCircle size={16} />
                    Join Discussion
                  </Button>
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                    Community governance and civic engagement
                  </div>
                </>
              )}
              {selectedFeature.properties?.layer === "Mind" && (
                <>
                  <Button className="w-full flex items-center justify-center gap-2" style={{ backgroundColor: LAYER_CONFIG.Mind.color }} onClick={() => setShowCopilot(selectedFeature)}>
                    <Lightbulb size={16} />
                    Ask SILAS AI
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handlePinAction(selectedFeature.properties.id, 'start_learning_path', 'Mind')}>
                    <TrendingUp size={16} />
                    Learning Path
                  </Button>
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                    Educational resources and AI-powered learning
                  </div>
                </>
              )}
              {selectedFeature.properties?.layer === "Pulse" && (
                <>
                  <Button className="w-full flex items-center justify-center gap-2" style={{ backgroundColor: LAYER_CONFIG.Pulse.color }} onClick={() => setShowDataInspector(selectedFeature)}>
                    <TrendingUp size={16} />
                    Inspect Data & Charts
                  </Button>
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => handlePinAction(selectedFeature.properties.id, 'compare_areas', 'Pulse')}>
                    <Database size={16} />
                    Compare Areas
                  </Button>
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                    Community metrics and performance data
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <Button onClick={() => handleVote(selectedFeature.properties?.id)} className="flex items-center gap-2" style={{ backgroundColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}><ThumbsUp size={16} />Support</Button>
              <span className="text-sm text-gray-600 font-medium">{selectedFeature.properties?.reactions || 0} reactions</span>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={16} style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }} />
                <span className="font-semibold text-sm" style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>Comments</span>
              </div>
              <div className="flex gap-2 mb-3">
                <Input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." className="flex-1" onKeyPress={(e) => e.key === 'Enter' && handleComment(selectedFeature.properties?.id)} />
                <Button onClick={() => handleComment(selectedFeature.properties?.id)} style={{ backgroundColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>Post</Button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                <div className="text-xs text-gray-400 text-center py-4">Comments will appear here.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showPinCreation && (
        <Card className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[400px] bg-white/98 backdrop-blur-md shadow-2xl border-2 animate-in fade-in zoom-in-95 duration-300" style={{ borderColor: LAYER_CONFIG[showPinCreation.layer]?.color }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: LAYER_CONFIG[showPinCreation.layer]?.color }}>
                {LAYER_CONFIG[showPinCreation.layer]?.icon && React.createElement(LAYER_CONFIG[showPinCreation.layer].icon, { size: 20 })}
                Create {showPinCreation.layer} Pin
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowPinCreation(null)}><X size={16} /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <PinCreationForm layer={showPinCreation.layer} onSubmit={handleCreatePin} onCancel={() => setShowPinCreation(null)} />
          </CardContent>
        </Card>
      )}

      {showDataInspector && (
        <DataInspector
          feature={showDataInspector}
          onClose={() => setShowDataInspector(null)}
        />
      )}

      {boundsWarning && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl border-2 border-red-600 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <X size={16} className="text-red-500" />
            </div>
            <div>
              <div className="font-semibold text-sm">Outside Stoneclough Boundary</div>
              <div className="text-xs opacity-90">Actions are only available within the community area</div>
            </div>
          </div>
        </div>
      )}

      {showMetrics && (
        <div className="absolute top-0 right-0 z-50 h-full w-[450px] bg-white/95 backdrop-blur-md shadow-2xl border-l-2 animate-in slide-in-from-right-5 duration-300" style={{ borderColor: LAYER_CONFIG[showMetrics]?.color }}>
          <CommunityMetrics
            layer={showMetrics}
            onClose={() => setShowMetrics(null)}
          />
        </div>
      )}

      {openPage && (
        <Card className="absolute top-24 left-4 z-40 w-[400px] max-h-[calc(100vh-140px)] overflow-y-auto bg-white/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-left-4 duration-300" style={{ borderColor: LAYER_CONFIG[openPage]?.color }}>
          <PageOverlay
            layer={openPage}
            onClose={() => setOpenPage(null)}
            onFlyTo={(coords) => mapApiRef.current?.flyToCoords(coords, 16)}
            onSelectFeature={openFeaturePage}
            onShowMetrics={setShowMetrics}
            onPinAction={handlePinAction}
            onVote={handleVote}
          />
        </Card>
      )}

      <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md">
        SILAS • Stoneclough Initiative for Local & Autonomous Systems
      </footer>
    </div>
  );
}
