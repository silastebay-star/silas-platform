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
import './App.css';

// Mapbox configuration with fallbacks
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN ||
                     process.env.VITE_MAPBOX_TOKEN ||
                     "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg";

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

    // Update paint properties
    if (map.getLayer("clusters")) map.setPaintProperty("clusters", "circle-color", activeLayer === 'All' ? LAYER_CONFIG.All.color : layerColor);
    if (map.getLayer("unclustered-point")) map.setPaintProperty("unclustered-point", "circle-color", pointColor);

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

function PageOverlay({ layer, onClose, onFlyTo, onSelectFeature, onShowMetrics, onPinAction, onVote }) {
  const Icon = LAYER_CONFIG[layer]?.icon;
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      tools: ['Analytics Dashboard', 'Health Metrics', 'Engagement Tracker', 'Trend Analysis'],
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
                className="text-xs justify-start"
                style={{ borderColor: LAYER_CONFIG[layer]?.color + '40', color: LAYER_CONFIG[layer]?.color }}
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
                className="text-xs justify-start"
                style={{ backgroundColor: LAYER_CONFIG[layer]?.color }}
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

  const openPageOverlay = (layer) => {
    setOpenPage(layer);
    setActiveLayer(layer);
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
            <div key={layer} className="flex items-center">
              <button
                onClick={() => { setActiveLayer(layer); setOpenPage(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-l-full font-medium transition-all ${activeLayer === layer ? "shadow-md text-white" : "text-gray-600 hover:bg-gray-100"}`}
                style={activeLayer === layer ? { backgroundColor: LAYER_CONFIG[layer].color } : {}}
              >
                {React.createElement(LAYER_CONFIG[layer].icon, { size: 14 })}
                {layer}
              </button>
              {layer !== "All" && (
                <button
                  onClick={() => openPageOverlay(layer)}
                  className={`px-2 py-1.5 rounded-r-full text-xs font-medium transition-all border-l ${openPage === layer ? "shadow-md text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  style={openPage === layer ? { backgroundColor: LAYER_CONFIG[layer].color } : {}}
                  title={`Open ${layer} Page`}
                >
                  Page
                </button>
              )}
            </div>
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
