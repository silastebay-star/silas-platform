import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import Papa from "papaparse";
import * as toGeoJSON from "@mapbox/togeojson";
import * as turf from "@turf/turf";
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { 
  X, MapPin, MessageCircle, ThumbsUp, Users, TrendingUp, Lightbulb, 
  Briefcase, Church, Hammer, Store, Vote, Heart, GraduationCap,
  BarChart3, PieChart, Activity, Calendar, FileText, Search, Menu,
  Plus, Building, Sparkles, Clock, User
} from 'lucide-react';
import silasLogo from './assets/silas-logo.png';
import './App.css';

if (typeof window !== 'undefined') {
  window.MAPBOX_TOKEN = "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg";
}

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg";
const MAPBOX_STYLE = "mapbox://styles/mapbox/streets-v12";

const LAYER_CONFIG = {
  Economy: { color: "#4c764c", id: "economy", icon: Briefcase, title: "Local Economy" },
  Commerce: { color: "#2f7a4a", id: "commerce", icon: Store, title: "Commerce & Trade" },
  Faith: { color: "#d2a24c", id: "faith", icon: Church, title: "Faith & Culture" },
  Works: { color: "#3c82b3", id: "works", icon: Hammer, title: "Community Works" },
  Circle: { color: "#b35c8a", id: "circle", icon: Vote, title: "Civic Circle" },
  Pulse: { color: "#6c4c76", id: "pulse", icon: Activity, title: "Community Pulse" },
  Mind: { color: "#6e7a72", id: "mind", icon: GraduationCap, title: "Collective Mind" },
};

const CENSUS_DATA = {
  population: 4300,
  households: 1900,
  employed: 2800,
};

// Sample events for this week
const THIS_WEEK_EVENTS = [
  { id: 1, title: "Community Garden Workday", date: "Today, 2pm", layer: "Works", color: "#3c82b3" },
  { id: 2, title: "Town Hall Meeting", date: "Wed, 7pm", layer: "Circle", color: "#b35c8a" },
  { id: 3, title: "Farmers Market", date: "Sat, 9am", layer: "Commerce", color: "#2f7a4a" },
  { id: 4, title: "Sunday Service", date: "Sun, 10am", layer: "Faith", color: "#d2a24c" },
];

// MapboxCentral Component
function MapboxCentral({ geojsonUrl, csvUrl, kmlUrl, onSelect, activeLayer }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [-2.3769, 53.5526],
      zoom: 14,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const loadAllData = async () => {
      try {
        const kmlResp = await fetch(kmlUrl);
        const kmlText = await kmlResp.text();
        const kmlDom = new DOMParser().parseFromString(kmlText, "application/xml");
        const boundaryGeoJSON = toGeoJSON.kml(kmlDom);
        
        if (boundaryGeoJSON?.features?.length) {
          const poly = boundaryGeoJSON.features.find((f) => 
            f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
          ) || boundaryGeoJSON.features[0];
          
          const bounds = turf.bbox(poly);
          map.fitBounds([[bounds[0] - 0.005, bounds[1] - 0.005], [bounds[2] + 0.005, bounds[3] + 0.005]], { padding: 20 });

          map.addSource("communityBoundary", { type: "geojson", data: poly });
          map.addLayer({ id: "boundary-fill", type: "fill", source: "communityBoundary", paint: { "fill-color": "#4c764c", "fill-opacity": 0.1 } });
          map.addLayer({ id: "boundary-line", type: "line", source: "communityBoundary", paint: { "line-color": "#4c764c", "line-width": 3 } });
        }

        const [geoRes, csvRes] = await Promise.all([fetch(geojsonUrl), fetch(csvUrl)]);
        const geoData = await geoRes.json();
        const csvText = await csvRes.text();
        const parsedCsv = Papa.parse(csvText, { header: true }).data;

        geoData.features.forEach((feature) => {
          const fname = String(feature.properties?.name || "").trim();
          const match = parsedCsv.find((row) => String(row.name || "").trim() === fname);
          if (match) feature.properties = { ...feature.properties, ...match };
          feature.properties.id = feature.properties.id || feature.properties?.name;
        });

        map.addSource("communityData", { 
          type: "geojson", 
          data: geoData, 
          cluster: true, 
          clusterRadius: 50,
          clusterMaxZoom: 14
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "communityData",
          filter: ["has", "point_count"],
          paint: { 
            "circle-color": LAYER_CONFIG.Economy.color, 
            "circle-radius": ["step", ["get", "point_count"], 20, 5, 30, 10, 40], 
            "circle-opacity": 0.8,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#fff"
          },
        });

        map.addLayer({ 
          id: "cluster-count", 
          type: "symbol", 
          source: "communityData", 
          filter: ["has", "point_count"], 
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 14 },
          paint: { "text-color": "#ffffff" }
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "communityData",
          filter: ["!has", "point_count"],
          paint: { 
            "circle-color": LAYER_CONFIG.Economy.color, 
            "circle-radius": 10, 
            "circle-stroke-width": 2, 
            "circle-stroke-color": "#fff",
            "circle-opacity": 0.9
          },
        });

        map.on("click", "unclustered-point", (e) => {
          const feature = e.features?.[0];
          if (feature) onSelect(feature);
        });

        map.on("click", "clusters", (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
          const clusterId = features[0].properties.cluster_id;
          map.getSource("communityData").getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (!err) map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 1 });
          });
        });

        ["unclustered-point", "clusters"].forEach(layer => {
          map.on("mouseenter", layer, () => map.getCanvas().style.cursor = "pointer");
          map.on("mouseleave", layer, () => map.getCanvas().style.cursor = "");
        });

        setMapLoaded(true);
      } catch (err) {
        console.error("Data loading error:", err);
      }
    };

    map.on("load", loadAllData);
    mapRef.current = map;
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [geojsonUrl, csvUrl, kmlUrl, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const color = LAYER_CONFIG[activeLayer]?.color || LAYER_CONFIG.Economy.color;

    try {
      if (map.getLayer("clusters")) map.setPaintProperty("clusters", "circle-color", color);
      if (map.getLayer("unclustered-point")) map.setPaintProperty("unclustered-point", "circle-color", color);

      if (activeLayer) {
        const layerId = LAYER_CONFIG[activeLayer]?.id || activeLayer.toLowerCase();
        const filter = ["any", ["==", ["downcase", ["get", "layer"]], activeLayer.toLowerCase()], ["in", layerId, ["downcase", ["coalesce", ["get", "tags"], ""]]]];
        if (map.getLayer("unclustered-point")) map.setFilter("unclustered-point", filter);
        if (map.getLayer("clusters")) map.setFilter("clusters", filter);
      } else {
        if (map.getLayer("unclustered-point")) map.setFilter("unclustered-point", null);
        if (map.getLayer("clusters")) map.setFilter("clusters", null);
      }
    } catch (e) {
      console.warn("Filter error:", e);
    }
  }, [activeLayer, mapLoaded]);

  return (
    <div className="absolute inset-0">
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-50">
          <div className="text-center text-white">
            <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading Stoneclough...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Creation Tool Modal
function CreateModal({ type, onClose, onSubmit }) {
  const [formData, setFormData] = useState({ name: "", description: "", layer: "Economy" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...formData, type });
    onClose();
  };

  const typeConfig = {
    business: { title: "Register Business", icon: Store, color: "#2f7a4a" },
    project: { title: "Create Project", icon: Hammer, color: "#3c82b3" },
    event: { title: "Add Event", icon: Calendar, color: "#b35c8a" },
    group: { title: "Form Group", icon: Users, color: "#4c764c" },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-3 border-b-2" style={{ borderColor: config.color }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={20} style={{ color: config.color }} />
              <CardTitle className="text-lg">{config.title}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input 
                placeholder={`${config.title} name...`}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Input 
                placeholder="Brief description..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <select 
                className="w-full px-3 py-2 border rounded-lg"
                value={formData.layer}
                onChange={(e) => setFormData({...formData, layer: e.target.value})}
              >
                {Object.keys(LAYER_CONFIG).map(layer => (
                  <option key={layer} value={layer}>{layer}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full" style={{ backgroundColor: config.color }}>
              <Plus size={16} className="mr-2" />
              Create {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Detailed Pin Profile Overlay
function PinProfileOverlay({ feature, onClose, onVote, onComment, feedback, commentText, setCommentText }) {
  const layer = feature.properties?.layer || "Economy";
  const color = LAYER_CONFIG[layer]?.color || "#4c764c";
  const Icon = LAYER_CONFIG[layer]?.icon || MapPin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-3 border-b-2 flex-shrink-0" style={{ borderColor: color }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ backgroundColor: color + "20" }}>
                <Icon size={24} style={{ color }} />
              </div>
              <div>
                <CardTitle className="text-xl">{feature.properties?.name || "Untitled"}</CardTitle>
                <CardDescription className="text-sm">{layer} • {feature.properties?.type || "Location"}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}><X size={20} /></Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 flex-1 overflow-y-auto">
          {/* Description */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText size={16} style={{ color }} />
              About
            </h3>
            <p className="text-gray-700">{feature.properties?.description || "No description available."}</p>
          </div>

          {/* Stats Grid */}
          {(feature.properties?.population || feature.properties?.households || feature.properties?.members) && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {feature.properties?.population && (
                <div className="p-3 border rounded-lg" style={{ borderColor: color + "40" }}>
                  <div className="text-xs text-gray-500 mb-1">Population</div>
                  <div className="text-2xl font-bold" style={{ color }}>{feature.properties.population}</div>
                </div>
              )}
              {feature.properties?.households && (
                <div className="p-3 border rounded-lg" style={{ borderColor: color + "40" }}>
                  <div className="text-xs text-gray-500 mb-1">Households</div>
                  <div className="text-2xl font-bold" style={{ color }}>{feature.properties.households}</div>
                </div>
              )}
              {feature.properties?.members && (
                <div className="p-3 border rounded-lg" style={{ borderColor: color + "40" }}>
                  <div className="text-xs text-gray-500 mb-1">Members</div>
                  <div className="text-2xl font-bold" style={{ color }}>{feature.properties.members}</div>
                </div>
              )}
              {feature.properties?.volunteers && (
                <div className="p-3 border rounded-lg" style={{ borderColor: color + "40" }}>
                  <div className="text-xs text-gray-500 mb-1">Volunteers</div>
                  <div className="text-2xl font-bold" style={{ color }}>{feature.properties.volunteers}</div>
                </div>
              )}
            </div>
          )}

          {/* Engagement Section */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Heart size={16} style={{ color }} />
              Community Engagement
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <Button 
                onClick={() => onVote(feature.properties?.id)} 
                className="flex items-center gap-2"
                style={{ backgroundColor: color }}
              >
                <ThumbsUp size={16} />
                Support ({(feature.properties?.reactions || 0) + (feedback[feature.properties?.id]?.votes || 0)})
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Users size={16} />
                Join
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Sparkles size={16} />
                Endorse
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageCircle size={16} style={{ color }} />
              Comments ({feedback[feature.properties?.id]?.comments?.length || 0})
            </h3>
            
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && onComment(feature.properties?.id)}
              />
              <Button onClick={() => onComment(feature.properties?.id)} style={{ backgroundColor: color }}>
                Post
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(feedback[feature.properties?.id]?.comments || []).map((c, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-gray-500" />
                    <span className="text-sm font-medium">Community Member</span>
                    <span className="text-xs text-gray-400">Just now</span>
                  </div>
                  <p className="text-sm text-gray-700">{c}</p>
                </div>
              ))}
              {(!feedback[feature.properties?.id]?.comments || feedback[feature.properties?.id]?.comments.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet. Be the first to share!</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Main SILAS Platform Component
export default function SilasPlatform() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [activeLayer, setActiveLayer] = useState("Economy");
  const [createModalType, setCreateModalType] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [commentText, setCommentText] = useState("");

  const geojsonPath = "/data/stoneclough_1759579511516.geojson";
  const csvPath = "/data/custom_area_data_1759579511516.csv";
  const kmlPath = "/data/stoneclough.kml";

  const handleVote = (id) => {
    setFeedback((prev) => ({ 
      ...prev, 
      [id]: { votes: (prev[id]?.votes || 0) + 1, comments: prev[id]?.comments || [] } 
    }));
  };

  const handleComment = (id) => {
    if (!commentText.trim()) return;
    setFeedback((prev) => ({ 
      ...prev, 
      [id]: { votes: prev[id]?.votes || 0, comments: [...(prev[id]?.comments || []), commentText] } 
    }));
    setCommentText("");
  };

  const handleCreate = (data) => {
    console.log("Creating:", data);
    // TODO: Add to map and database
  };

  const LayerIcon = LAYER_CONFIG[activeLayer]?.icon || Briefcase;
  const layerColor = LAYER_CONFIG[activeLayer]?.color || "#4c764c";

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-900">
      {/* Map */}
      <MapboxCentral 
        geojsonUrl={geojsonPath} 
        csvPath={csvPath} 
        kmlPath={kmlPath} 
        onSelect={setSelectedFeature} 
        activeLayer={activeLayer} 
      />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-lg border-b-2" style={{ borderBottomColor: layerColor }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={silasLogo} alt="SILAS" className="h-8 w-8" />
            <div className="font-bold text-lg" style={{ color: layerColor }}>SILAS</div>
          </div>
          
          <nav className="hidden md:flex gap-2">
            {Object.keys(LAYER_CONFIG).map((layer) => {
              const Icon = LAYER_CONFIG[layer].icon;
              return (
                <button key={layer} onClick={() => { setActiveLayer(layer); setSelectedFeature(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${activeLayer === layer ? "text-white shadow-lg" : "text-gray-600 hover:bg-gray-100"}`}
                  style={activeLayer === layer ? { backgroundColor: LAYER_CONFIG[layer].color } : {}}>
                  <Icon size={14} />
                  <span className="hidden lg:inline">{layer}</span>
                </button>
              );
            })}
          </nav>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu size={24} style={{ color: layerColor }} />
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white p-3 grid grid-cols-2 gap-2">
            {Object.keys(LAYER_CONFIG).map((layer) => {
              const Icon = LAYER_CONFIG[layer].icon;
              return (
                <button key={layer} onClick={() => { setActiveLayer(layer); setSelectedFeature(null); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${activeLayer === layer ? "text-white shadow-lg" : "text-gray-700 bg-gray-50"}`}
                  style={activeLayer === layer ? { backgroundColor: LAYER_CONFIG[layer].color } : {}}>
                  <Icon size={16} />
                  {layer}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* This Week's Events Calendar */}
      <div className="absolute top-20 left-4 z-30 w-72 max-w-[calc(100vw-2rem)]">
        <Card className="bg-white/95 backdrop-blur-md shadow-xl border-2 border-purple-400">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-purple-600" />
              <CardTitle className="text-sm">This Week's Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {THIS_WEEK_EVENTS.map(event => (
                <div key={event.id} className="flex items-center gap-2 p-2 rounded-lg border hover:shadow-md transition-all cursor-pointer" style={{ borderColor: event.color + "40" }}>
                  <Clock size={14} style={{ color: event.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{event.title}</div>
                    <div className="text-xs text-gray-500">{event.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Tools */}
      <div className="absolute top-20 right-4 z-30 w-80 max-w-[calc(100vw-2rem)]">
        <Card className="bg-white/95 backdrop-blur-md shadow-xl border-2" style={{ borderColor: layerColor }}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <LayerIcon size={18} style={{ color: layerColor }} />
              <CardTitle className="text-sm">Add to Map</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="flex items-center gap-2 justify-start" onClick={() => setCreateModalType("business")}>
                <Store size={16} />
                <span className="text-xs">Business</span>
              </Button>
              <Button variant="outline" className="flex items-center gap-2 justify-start" onClick={() => setCreateModalType("project")}>
                <Hammer size={16} />
                <span className="text-xs">Project</span>
              </Button>
              <Button variant="outline" className="flex items-center gap-2 justify-start" onClick={() => setCreateModalType("event")}>
                <Calendar size={16} />
                <span className="text-xs">Event</span>
              </Button>
              <Button variant="outline" className="flex items-center gap-2 justify-start" onClick={() => setCreateModalType("group")}>
                <Users size={16} />
                <span className="text-xs">Group</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pin Profile Overlay */}
      {selectedFeature && (
        <PinProfileOverlay 
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
          onVote={handleVote}
          onComment={handleComment}
          feedback={feedback}
          commentText={commentText}
          setCommentText={setCommentText}
        />
      )}

      {/* Create Modal */}
      {createModalType && (
        <CreateModal 
          type={createModalType}
          onClose={() => setCreateModalType(null)}
          onSubmit={handleCreate}
        />
      )}

      {/* Footer */}
      <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-xs text-white bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full hidden md:block">
        SILAS • Population: {CENSUS_DATA.population} • Live Community Map
      </footer>
    </div>
  );
}
