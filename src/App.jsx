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
  BarChart3, PieChart, Activity, Calendar, FileText, Search, Menu
} from 'lucide-react';
import silasLogo from './assets/silas-logo.png';
import './App.css';

// Force Mapbox token to be available globally
if (typeof window !== 'undefined') {
  window.MAPBOX_TOKEN = "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg";
}

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg";
const MAPBOX_STYLE = "mapbox://styles/silastebay/cmgaznfkx000f01qu43308dzx";

const LAYER_CONFIG = {
  Economy: { 
    color: "#4c764c", 
    id: "economy", 
    icon: Briefcase,
    title: "Local Economy",
    description: "Employment & prosperity"
  },
  Commerce: { 
    color: "#2f7a4a", 
    id: "commerce", 
    icon: Store,
    title: "Commerce & Trade",
    description: "Local businesses & markets"
  },
  Faith: { 
    color: "#d2a24c", 
    id: "faith", 
    icon: Church,
    title: "Faith & Culture",
    description: "Worship & spiritual life"
  },
  Works: { 
    color: "#3c82b3", 
    id: "works", 
    icon: Hammer,
    title: "Community Works",
    description: "Projects & volunteering"
  },
  Circle: { 
    color: "#b35c8a", 
    id: "circle", 
    icon: Vote,
    title: "Civic Circle",
    description: "Governance & proposals"
  },
  Pulse: { 
    color: "#6c4c76", 
    id: "pulse", 
    icon: Activity,
    title: "Community Pulse",
    description: "Data & metrics"
  },
  Mind: { 
    color: "#6e7a72", 
    id: "mind", 
    icon: GraduationCap,
    title: "Collective Mind",
    description: "Learning & AI"
  },
};

const CENSUS_DATA = {
  population: 4300,
  households: 1900,
  employed: 2800,
  christian: 2656,
  healthScore: 8.2
};

// MapboxCentral Component
function MapboxCentral({ geojsonUrl, csvUrl, kmlUrl, onSelect, activeLayer }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set token immediately
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    if (!mapContainer.current || mapRef.current) return;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLE,
        center: [-2.3769, 53.5526],
        zoom: 14,
        attributionControl: false
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const loadAllData = async () => {
        try {
          // Load KML boundary
          const kmlResp = await fetch(kmlUrl);
          const kmlText = await kmlResp.text();
          const kmlDom = new DOMParser().parseFromString(kmlText, "application/xml");
          const boundaryGeoJSON = toGeoJSON.kml(kmlDom);
          
          if (boundaryGeoJSON?.features?.length) {
            const poly = boundaryGeoJSON.features.find((f) => 
              f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"
            ) || boundaryGeoJSON.features[0];
            
            const bounds = turf.bbox(poly);
            map.fitBounds(
              [[bounds[0] - 0.005, bounds[1] - 0.005], [bounds[2] + 0.005, bounds[3] + 0.005]], 
              { padding: 20 }
            );

            map.addSource("communityBoundary", { 
              type: "geojson", 
              data: poly 
            });
            map.addLayer({ 
              id: "boundary-fill", 
              type: "fill", 
              source: "communityBoundary", 
              paint: { "fill-color": "#4c764c", "fill-opacity": 0.1 } 
            });
            map.addLayer({ 
              id: "boundary-line", 
              type: "line", 
              source: "communityBoundary", 
              paint: { "line-color": "#4c764c", "line-width": 3 } 
            });
          }

          // Load GeoJSON and CSV
          const [geoRes, csvRes] = await Promise.all([
            fetch(geojsonUrl), 
            fetch(csvUrl)
          ]);
          const geoData = await geoRes.json();
          const csvText = await csvRes.text();
          const parsedCsv = Papa.parse(csvText, { header: true }).data;

          // Merge data
          geoData.features.forEach((feature) => {
            const fname = String(feature.properties?.name || "").trim();
            const match = parsedCsv.find((row) => 
              String(row.name || "").trim() === fname
            );
            if (match) feature.properties = { ...feature.properties, ...match };
            feature.properties.id = feature.properties.id || feature.properties?.name;
          });

          // Add source and layers
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
            layout: { 
              "text-field": ["get", "point_count_abbreviated"], 
              "text-size": 14,
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"]
            },
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

          // Click interactions
          map.on("click", "unclustered-point", (e) => {
            const feature = e.features?.[0];
            if (feature) onSelect(feature);
          });

          map.on("click", "clusters", (e) => {
            const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
            const clusterId = features[0].properties.cluster_id;
            map.getSource("communityData").getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (!err) {
                map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 1 });
              }
            });
          });

          // Hover effects
          ["unclustered-point", "clusters"].forEach(layer => {
            map.on("mouseenter", layer, () => map.getCanvas().style.cursor = "pointer");
            map.on("mouseleave", layer, () => map.getCanvas().style.cursor = "");
          });

          setMapLoaded(true);
        } catch (err) {
          console.error("Data loading error:", err);
          setError(err.message);
        }
      };

      map.on("load", loadAllData);
      map.on("error", (e) => {
        console.error("Map error:", e);
        setError("Map failed to load");
      });

      mapRef.current = map;
      
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      console.error("Map initialization error:", err);
      setError(err.message);
    }
  }, [geojsonUrl, csvUrl, kmlUrl, onSelect]);

  // React to activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const color = LAYER_CONFIG[activeLayer]?.color || LAYER_CONFIG.Economy.color;

    try {
      if (map.getLayer("clusters")) {
        map.setPaintProperty("clusters", "circle-color", color);
      }
      if (map.getLayer("unclustered-point")) {
        map.setPaintProperty("unclustered-point", "circle-color", color);
      }

      if (activeLayer) {
        const layerId = LAYER_CONFIG[activeLayer]?.id || activeLayer.toLowerCase();
        const filter = [
          "any", 
          ["==", ["downcase", ["get", "layer"]], activeLayer.toLowerCase()], 
          ["in", layerId, ["downcase", ["coalesce", ["get", "tags"], ""]]]
        ];
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
      {!mapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-50">
          <div className="text-center text-white">
            <Activity className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading Stoneclough...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 backdrop-blur-sm z-50">
          <div className="text-center text-white p-6">
            <X className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Map Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Tool Modal Component
function ToolModal({ tool, layer, onClose }) {
  const color = LAYER_CONFIG[layer]?.color || "#4c764c";
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-3" style={{ borderBottomColor: color, borderBottomWidth: 2 }}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{tool.title}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
          {tool.description && <CardDescription className="text-sm">{tool.description}</CardDescription>}
        </CardHeader>
        <CardContent className="pt-4">
          {tool.content}
        </CardContent>
      </Card>
    </div>
  );
}

// Layer Tools Definitions
const LAYER_TOOLS = {
  Economy: [
    { id: "jobs", title: "Job Board", icon: Briefcase, description: "Local employment opportunities", content: <div className="space-y-3"><p className="text-sm text-gray-600">Browse local job openings and post opportunities.</p><Button className="w-full">View Jobs</Button></div> },
    { id: "skills", title: "Skills Directory", icon: Users, description: "Community skills & talents", content: <div className="space-y-3"><p className="text-sm text-gray-600">Find skilled community members for projects.</p><Button className="w-full">Search Skills</Button></div> },
    { id: "reports", title: "Economic Reports", icon: BarChart3, description: "Impact & growth data", content: <div className="space-y-3"><p className="text-sm text-gray-600">Employment: 65.1% | Working Age: 2,400</p><Button className="w-full">View Report</Button></div> },
  ],
  Commerce: [
    { id: "directory", title: "Business Directory", icon: Store, description: "Local businesses", content: <div className="space-y-3"><div className="p-3 border rounded"><div className="font-semibold">GreenRoots Cafe</div><p className="text-sm text-gray-600">Cafe & Restaurant</p></div><Button className="w-full">View All</Button></div> },
    { id: "endorse", title: "Endorsements", icon: Heart, description: "Support local businesses", content: <div className="space-y-3"><p className="text-sm text-gray-600">Endorse businesses you trust and recommend.</p><Button className="w-full">Endorse</Button></div> },
    { id: "markets", title: "Markets & Events", icon: Calendar, description: "Trade events", content: <div className="space-y-3"><p className="text-sm text-gray-600">Upcoming farmers markets and trade fairs.</p><Button className="w-full">View Calendar</Button></div> },
  ],
  Faith: [
    { id: "worship", title: "Places of Worship", icon: Church, description: "Religious centers", content: <div className="space-y-3"><div className="p-3 border rounded"><div className="font-semibold">St. Mary's Church</div><p className="text-sm text-gray-600">Sunday 10am</p></div><Button className="w-full">View All</Button></div> },
    { id: "calendar", title: "Cultural Calendar", icon: Calendar, description: "Religious events", content: <div className="space-y-3"><p className="text-sm text-gray-600">Upcoming religious and cultural celebrations.</p><Button className="w-full">View Events</Button></div> },
    { id: "dialogue", title: "Interfaith Dialogue", icon: Users, description: "Community unity", content: <div className="space-y-3"><p className="text-sm text-gray-600">Join conversations across faith communities.</p><Button className="w-full">Join Discussion</Button></div> },
  ],
  Works: [
    { id: "projects", title: "Active Projects", icon: Hammer, description: "Community initiatives", content: <div className="space-y-3"><div className="p-3 border rounded"><div className="font-semibold">Riverbank Restoration</div><p className="text-sm text-gray-600">200 shrubs planted</p></div><Button className="w-full">Join Project</Button></div> },
    { id: "volunteer", title: "Volunteer", icon: Users, description: "Get involved", content: <div className="space-y-3"><p className="text-sm text-gray-600">Sign up to help with community projects.</p><Button className="w-full">Sign Up</Button></div> },
    { id: "propose", title: "Propose Project", icon: Lightbulb, description: "Share your idea", content: <div className="space-y-3"><Input placeholder="Project name" /><Button className="w-full">Submit</Button></div> },
  ],
  Circle: [
    { id: "proposals", title: "Active Proposals", icon: Vote, description: "Community decisions", content: <div className="space-y-3"><div className="p-3 border rounded"><div className="font-semibold">Youth Centre</div><p className="text-sm text-gray-600">89 supporters</p></div><Button className="w-full">Vote</Button></div> },
    { id: "forum", title: "Discussion Forum", icon: MessageCircle, description: "Community dialogue", content: <div className="space-y-3"><p className="text-sm text-gray-600">Join ongoing community discussions.</p><Button className="w-full">View Forum</Button></div> },
    { id: "results", title: "Voting Results", icon: BarChart3, description: "Past decisions", content: <div className="space-y-3"><p className="text-sm text-gray-600">See outcomes of previous votes.</p><Button className="w-full">View Results</Button></div> },
  ],
  Pulse: [
    { id: "census", title: "Census Dashboard", icon: BarChart3, description: "Population data", content: <div className="space-y-3"><div className="grid grid-cols-2 gap-2"><div className="p-2 border rounded text-center"><div className="text-2xl font-bold">4,300</div><div className="text-xs">Population</div></div><div className="p-2 border rounded text-center"><div className="text-2xl font-bold">1,900</div><div className="text-xs">Households</div></div></div></div> },
    { id: "demographics", title: "Demographics", icon: PieChart, description: "Community profile", content: <div className="space-y-3"><p className="text-sm text-gray-600">Age, ethnicity, and household data.</p><Button className="w-full">View Report</Button></div> },
    { id: "health", title: "Health Metrics", icon: Activity, description: "Community wellbeing", content: <div className="space-y-3"><p className="text-sm text-gray-600">Health Score: 8.2/10 | 53% Very Good Health</p><Button className="w-full">View Details</Button></div> },
  ],
  Mind: [
    { id: "ai", title: "Ask SILAS", icon: Lightbulb, description: "AI assistant", content: <div className="space-y-3"><Input placeholder="Ask a question..." /><Button className="w-full">Get Answer</Button></div> },
    { id: "learning", title: "Learning Paths", icon: GraduationCap, description: "Education", content: <div className="space-y-3"><div className="p-3 border rounded"><div className="font-semibold">Sustainable Living</div><p className="text-sm text-gray-600">Eco-friendly practices</p></div><Button className="w-full">Start Learning</Button></div> },
    { id: "knowledge", title: "Knowledge Base", icon: Search, description: "Resources", content: <div className="space-y-3"><p className="text-sm text-gray-600">Search community knowledge and resources.</p><Button className="w-full">Search</Button></div> },
  ],
};

// Main SILAS Platform Component
export default function SilasPlatform() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [activeLayer, setActiveLayer] = useState("Economy");
  const [activeTool, setActiveTool] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [commentText, setCommentText] = useState("");

  const geojsonPath = "/data/stoneclough_1759579511516.geojson";
  const csvPath = "/data/custom_area_data_1759579511516.csv";
  const kmlPath = "/data/stoneclough.kml";

  const handleVote = (id) => {
    setFeedback((prev) => ({ 
      ...prev, 
      [id]: { 
        votes: (prev[id]?.votes || 0) + 1, 
        comments: prev[id]?.comments || [] 
      } 
    }));
  };

  const handleComment = (id) => {
    if (!commentText.trim()) return;
    setFeedback((prev) => ({ 
      ...prev, 
      [id]: { 
        votes: prev[id]?.votes || 0, 
        comments: [...(prev[id]?.comments || []), commentText] 
      } 
    }));
    setCommentText("");
  };

  const LayerIcon = LAYER_CONFIG[activeLayer]?.icon || Briefcase;
  const layerColor = LAYER_CONFIG[activeLayer]?.color || "#4c764c";

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-900">
      {/* Map */}
      <MapboxCentral 
        geojsonUrl={geojsonPath} 
        csvUrl={csvPath} 
        kmlUrl={kmlPath} 
        onSelect={setSelectedFeature} 
        activeLayer={activeLayer} 
      />

      {/* Mobile Header */}
      <header className="absolute top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-lg border-b-2" 
        style={{ borderBottomColor: layerColor }}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={silasLogo} alt="SILAS" className="h-8 w-8" />
            <div className="font-bold text-lg" style={{ color: layerColor }}>SILAS</div>
          </div>
          
          {/* Desktop Layer Nav */}
          <nav className="hidden md:flex gap-2">
            {Object.keys(LAYER_CONFIG).map((layer) => {
              const Icon = LAYER_CONFIG[layer].icon;
              return (
                <button
                  key={layer}
                  onClick={() => { setActiveLayer(layer); setSelectedFeature(null); setActiveTool(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeLayer === layer ? "text-white shadow-lg" : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={activeLayer === layer ? { backgroundColor: LAYER_CONFIG[layer].color } : {}}
                >
                  <Icon size={14} />
                  <span className="hidden lg:inline">{layer}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu size={24} style={{ color: layerColor }} />
          </button>
        </div>

        {/* Mobile Layer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white p-3 grid grid-cols-2 gap-2">
            {Object.keys(LAYER_CONFIG).map((layer) => {
              const Icon = LAYER_CONFIG[layer].icon;
              return (
                <button
                  key={layer}
                  onClick={() => { 
                    setActiveLayer(layer); 
                    setSelectedFeature(null); 
                    setActiveTool(null); 
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeLayer === layer ? "text-white shadow-lg" : "text-gray-700 bg-gray-50"
                  }`}
                  style={activeLayer === layer ? { backgroundColor: LAYER_CONFIG[layer].color } : {}}
                >
                  <Icon size={16} />
                  {layer}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Layer Info Card - Compact */}
      <div className="absolute top-20 right-4 z-30 w-80 max-w-[calc(100vw-2rem)] md:w-96">
        <Card className="bg-white/95 backdrop-blur-md shadow-xl border-2" style={{ borderColor: layerColor }}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <LayerIcon size={20} style={{ color: layerColor }} />
              <div>
                <CardTitle className="text-base">{LAYER_CONFIG[activeLayer]?.title}</CardTitle>
                <CardDescription className="text-xs">{LAYER_CONFIG[activeLayer]?.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 gap-2">
              {LAYER_TOOLS[activeLayer]?.map((tool) => {
                const ToolIcon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:shadow-md transition-all bg-white"
                    style={{ borderColor: layerColor + "40" }}
                  >
                    <ToolIcon size={20} style={{ color: layerColor }} />
                    <span className="text-xs font-medium text-center">{tool.title}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Popup - Compact */}
      {selectedFeature && (
        <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 z-30">
          <Card className="bg-white/95 backdrop-blur-md shadow-xl border-2 animate-in slide-in-from-bottom-4 duration-200" 
            style={{ borderColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2" 
                  style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
                  <MapPin size={16} />
                  {selectedFeature.properties?.name || "Location"}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedFeature(null)}>
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-sm text-gray-700 mb-3">
                {selectedFeature.properties?.description || "No description available."}
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  onClick={() => handleVote(selectedFeature.properties?.id)} 
                  className="flex items-center gap-1"
                  style={{ backgroundColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}
                >
                  <ThumbsUp size={14} />
                  Support ({(selectedFeature.properties?.reactions || 0) + (feedback[selectedFeature.properties?.id]?.votes || 0)})
                </Button>
                <Button size="sm" variant="outline" className="flex items-center gap-1">
                  <MessageCircle size={14} />
                  Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tool Modal */}
      {activeTool && (
        <ToolModal 
          tool={activeTool} 
          layer={activeLayer} 
          onClose={() => setActiveTool(null)} 
        />
      )}

      {/* Footer */}
      <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-xs text-white bg-black/50 backdrop-blur-sm px-4 py-1 rounded-full hidden md:block">
        SILAS • Population: {CENSUS_DATA.population}
      </footer>
    </div>
  );
}
