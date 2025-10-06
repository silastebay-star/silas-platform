import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import Papa from "papaparse";
import * as toGeoJSON from "@mapbox/togeojson";
import * as turf from "@turf/turf";
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { X, MapPin, MessageCircle, ThumbsUp, Users, TrendingUp, Lightbulb, Briefcase, Church, Hammer } from 'lucide-react';
import silasLogo from './assets/silas-logo.png';
import './App.css';

/**
 * SILAS - Enhanced Map-Centric Platform
 * - KML boundary enforcement
 * - Layer-based filtering (Economy, Faith, Works, Commerce, Circle, Pulse, Mind)
 * - Interactive popups with layer-specific actions
 * - Social feed with map integration
 * - Full frontend functionality ready for Supabase backend
 */

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg";
const MAPBOX_STYLE = "mapbox://styles/silastebay/cmgaznfkx000f01qu43308dzx";

const LAYER_CONFIG = {
  Economy: { color: "#4c764c", id: "economy", icon: Briefcase },
  Faith: { color: "#d2a24c", id: "faith", icon: Church },
  Works: { color: "#3c82b3", id: "works", icon: Hammer },
  Pulse: { color: "#6c4c76", id: "pulse", icon: TrendingUp },
  Mind: { color: "#6e7a72", id: "mind", icon: Lightbulb },
  Circle: { color: "#b35c8a", id: "circle", icon: Users },
  Commerce: { color: "#2f7a4a", id: "commerce", icon: Briefcase },
};

// MapboxCentral Component with KML boundary support
function MapboxCentral({ geojsonUrl, csvUrl, kmlUrl, onSelect, mapApiRef, activeLayer }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const boundaryPolygonRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }, []);

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

    const loadAllData = async () => {
      // 1) Load KML boundary and convert to GeoJSON
      let boundaryGeoJSON = null;
      try {
        const kmlResp = await fetch(kmlUrl);
        const kmlText = await kmlResp.text();
        const kmlDom = new DOMParser().parseFromString(kmlText, "application/xml");
        boundaryGeoJSON = toGeoJSON.kml(kmlDom);
        
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

          // Add boundary layer
          if (!map.getSource("communityBoundary")) {
            map.addSource("communityBoundary", { 
              type: "geojson", 
              data: boundaryPolygonRef.current 
            });
            map.addLayer({ 
              id: "boundary-fill", 
              type: "fill", 
              source: "communityBoundary", 
              paint: { "fill-color": "#ffffff", "fill-opacity": 0 } 
            });
            map.addLayer({ 
              id: "boundary-line", 
              type: "line", 
              source: "communityBoundary", 
              paint: { "line-color": "#4c764c", "line-width": 3 } 
            });
          }
        }
      } catch (err) {
        console.warn("Failed to load/parse KML boundary:", err);
      }

      // 2) Load main GeoJSON and CSV metadata
      const [geoRes, csvRes] = await Promise.all([
        fetch(geojsonUrl), 
        fetch(csvUrl)
      ]);
      const geoData = await geoRes.json();
      const csvText = await csvRes.text();
      const parsedCsv = Papa.parse(csvText, { header: true }).data;

      // Merge CSV data into GeoJSON features
      geoData.features.forEach((feature) => {
        const fname = String(feature.properties?.name || feature.properties?.id || "").trim();
        const match = parsedCsv.find((row) => 
          String(row.name || row.id || "").trim() === fname
        );
        if (match) feature.properties = { ...feature.properties, ...match };
        feature.properties.id = feature.properties.id || feature.id || feature.properties?.name;
        if (!feature.properties.layer && feature.properties.tags) {
          const tags = String(feature.properties.tags).split(",").map((t) => t.trim());
          const found = tags.find((t) => 
            Object.keys(LAYER_CONFIG).includes(capitalize(t))
          );
          if (found) feature.properties.layer = capitalize(found);
        }
      });

      // Add source and layers
      if (!map.getSource("communityData")) {
        map.addSource("communityData", { 
          type: "geojson", 
          data: geoData, 
          cluster: true, 
          clusterRadius: 50 
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "communityData",
          filter: ["has", "point_count"],
          paint: { 
            "circle-color": LAYER_CONFIG.Economy.color, 
            "circle-radius": ["step", ["get", "point_count"], 15, 10, 20, 30, 25], 
            "circle-opacity": 0.9 
          },
        });

        map.addLayer({ 
          id: "cluster-count", 
          type: "symbol", 
          source: "communityData", 
          filter: ["has", "point_count"], 
          layout: { 
            "text-field": ["get", "point_count_abbreviated"], 
            "text-size": 12 
          } 
        });

        map.addLayer({
          id: "unclustered-point",
          type: "circle",
          source: "communityData",
          filter: ["!has", "point_count"],
          paint: { 
            "circle-color": LAYER_CONFIG.Economy.color, 
            "circle-radius": 8, 
            "circle-stroke-width": 2, 
            "circle-stroke-color": "#fff" 
          },
        });
      } else {
        map.getSource("communityData").setData(geoData);
      }

      // Click interactions
      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        onSelect(feature);
      });

      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"]
        });
        const clusterId = features[0].properties.cluster_id;
        map.getSource("communityData").getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          }
        );
      });

      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
    };

    map.on("load", loadAllData);

    mapRef.current = map;
    return () => map.remove();
  }, [geojsonUrl, csvUrl, kmlUrl, onSelect, mapApiRef]);

  // React to activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer("unclustered-point")) return;

    const color = activeLayer ? LAYER_CONFIG[activeLayer]?.color : LAYER_CONFIG.Economy.color;

    // Update paint properties
    if (map.getLayer("clusters")) {
      map.setPaintProperty("clusters", "circle-color", color);
    }
    if (map.getLayer("unclustered-point")) {
      map.setPaintProperty("unclustered-point", "circle-color", color);
    }

    // Filter features by layer
    if (activeLayer) {
      const layerId = LAYER_CONFIG[activeLayer]?.id || activeLayer.toLowerCase();
      const pointFilter = [
        "any", 
        ["==", ["get", "layer"], activeLayer], 
        ["in", layerId, ["downcase", ["get", "tags"]]]
      ];
      try {
        if (map.getLayer("unclustered-point")) {
          map.setFilter("unclustered-point", pointFilter);
        }
        if (map.getLayer("clusters")) {
          map.setFilter("clusters", pointFilter);
        }
      } catch (e) {
        console.warn("Filter error:", e);
      }
    } else {
      try {
        if (map.getLayer("unclustered-point")) {
          map.setFilter("unclustered-point", null);
        }
        if (map.getLayer("clusters")) {
          map.setFilter("clusters", null);
        }
      } catch (e) {
        console.warn("Filter reset error:", e);
      }
    }
  }, [activeLayer]);

  return <div ref={mapContainer} className="absolute inset-0 z-0" />;
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Sample social feed data
const sampleFeed = [
  { 
    id: "post1", 
    type: "project", 
    title: "Riverbank Restoration - Update", 
    excerpt: "We planted 200 native shrubs this weekend!", 
    coords: [-2.3800, 53.5545], 
    featureName: "Riverbank Restoration", 
    layer: "Works",
    reactions: 67
  },
  { 
    id: "post2", 
    type: "business", 
    title: "GreenRoots Cafe Joined", 
    excerpt: "Now serving seasonal pies and community-grown produce.", 
    coords: [-2.3750, 53.5540], 
    featureName: "GreenRoots Cafe", 
    layer: "Commerce",
    reactions: 28
  },
  { 
    id: "post3", 
    type: "discussion", 
    title: "Youth Centre Proposal", 
    excerpt: "Share your thoughts at next meeting.", 
    coords: [-2.3775, 53.5550], 
    featureName: "Youth Centre", 
    layer: "Circle",
    reactions: 89
  },
];

// Main SILAS Platform Component
export default function SilasPlatform() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [viewMode, setViewMode] = useState("map");
  const [openPage, setOpenPage] = useState(null);
  const [activeLayer, setActiveLayer] = useState("Economy");
  const [feedback, setFeedback] = useState({});
  const [commentText, setCommentText] = useState("");

  const geojsonPath = "/data/stoneclough_1759579511516.geojson";
  const csvPath = "/data/custom_area_data_1759579511516.csv";
  const kmlPath = "/data/stoneclough.kml";

  const mapApiRef = useRef(null);

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

  const LayerIcon = activeLayer ? LAYER_CONFIG[activeLayer]?.icon : Briefcase;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-100">
      <MapboxCentral 
        geojsonUrl={geojsonPath} 
        csvUrl={csvPath} 
        kmlUrl={kmlPath} 
        onSelect={openFeaturePage} 
        mapApiRef={mapApiRef} 
        activeLayer={activeLayer} 
      />

      {/* Top Navigation */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border-2 transition-all" 
        style={{ borderColor: LAYER_CONFIG[activeLayer]?.color || LAYER_CONFIG.Economy.color }}>
        <img src={silasLogo} alt="SILAS" className="h-8 w-8 mr-3" />
        <div className="font-bold text-xl mr-6" 
          style={{ color: LAYER_CONFIG[activeLayer]?.color || LAYER_CONFIG.Economy.color }}>
          SILAS
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 mr-6 bg-gray-100 rounded-full p-1">
          <button 
            onClick={() => setViewMode("map")} 
            className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${viewMode === "map" ? "bg-white shadow-md" : "bg-transparent text-gray-600"}`}>
            Map
          </button>
          <button 
            onClick={() => setViewMode("social")} 
            className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${viewMode === "social" ? "bg-white shadow-md" : "bg-transparent text-gray-600"}`}>
            Social
          </button>
        </div>

        {/* Layer Navigation */}
        <nav className="flex gap-3 text-sm">
          {Object.keys(LAYER_CONFIG).map((layer) => {
            const Icon = LAYER_CONFIG[layer].icon;
            return (
              <button
                key={layer}
                onClick={() => {
                  setActiveLayer(layer);
                  setOpenPage(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                  activeLayer === layer 
                    ? "shadow-md text-white" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                style={activeLayer === layer ? { backgroundColor: LAYER_CONFIG[layer].color } : {}}
              >
                <Icon size={14} />
                {layer}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Social Feed View */}
      {viewMode === "social" && (
        <Card className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[600px] max-h-[calc(100vh-140px)] overflow-y-auto bg-white/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2" 
              style={{ color: LAYER_CONFIG[activeLayer]?.color }}>
              <MessageCircle size={20} />
              Community Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleFeed.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleFeedItemClick(item)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{item.title}</div>
                      <div className="text-sm text-gray-600 mb-2">{item.excerpt}</div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {item.featureName}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} />
                          {item.reactions} reactions
                        </span>
                      </div>
                    </div>
                    <div 
                      className="w-2 h-2 rounded-full mt-2" 
                      style={{ backgroundColor: LAYER_CONFIG[item.layer]?.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Details Popup */}
      {selectedFeature && viewMode === "map" && (
        <Card className="absolute top-24 right-6 z-30 w-[420px] bg-white/98 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-right-4 duration-300" 
          style={{ borderColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" 
                style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
                <LayerIcon size={20} />
                {selectedFeature.properties?.name || "Untitled"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFeature(null)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 mb-4">
              {selectedFeature.properties?.description || "No description available."}
            </div>

            {/* Layer-specific stats */}
            {selectedFeature.properties?.population && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Population</div>
                  <div className="text-lg font-bold" 
                    style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
                    {selectedFeature.properties?.population}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">Households</div>
                  <div className="text-lg font-bold" 
                    style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
                    {selectedFeature.properties?.households}
                  </div>
                </div>
              </div>
            )}

            {/* Layer-specific actions */}
            <div className="space-y-2 mb-4">
              {selectedFeature.properties?.layer === "Faith" && (
                <>
                  <Button className="w-full" 
                    style={{ backgroundColor: LAYER_CONFIG.Faith.color }}>
                    Amen
                  </Button>
                  <Button variant="outline" className="w-full">
                    Follow
                  </Button>
                </>
              )}
              {(selectedFeature.properties?.layer === "Commerce" || selectedFeature.properties?.layer === "Economy") && (
                <>
                  <Button className="w-full" 
                    style={{ backgroundColor: LAYER_CONFIG[selectedFeature.properties?.layer].color }}>
                    Endorse Business
                  </Button>
                  <Button variant="outline" className="w-full">
                    Request Mentorship
                  </Button>
                </>
              )}
              {selectedFeature.properties?.layer === "Works" && (
                <>
                  <Button className="w-full" 
                    style={{ backgroundColor: LAYER_CONFIG.Works.color }}>
                    Join Project
                  </Button>
                  <Button variant="outline" className="w-full">
                    Donate Materials
                  </Button>
                </>
              )}
              {selectedFeature.properties?.layer === "Circle" && (
                <>
                  <Button className="w-full" 
                    style={{ backgroundColor: LAYER_CONFIG.Circle.color }}>
                    Vote
                  </Button>
                  <Button variant="outline" className="w-full">
                    Discuss
                  </Button>
                </>
              )}
              {selectedFeature.properties?.layer === "Mind" && (
                <>
                  <Button className="w-full" 
                    style={{ backgroundColor: LAYER_CONFIG.Mind.color }}>
                    Ask SILAS
                  </Button>
                  <Button variant="outline" className="w-full">
                    Learning Path
                  </Button>
                </>
              )}
              {selectedFeature.properties?.layer === "Pulse" && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">KPIs</div>
                  <div className="text-sm text-gray-700">
                    {selectedFeature.properties?.kpi || "No data available"}
                  </div>
                </div>
              )}
            </div>

            {/* Voting and Comments */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <Button 
                onClick={() => handleVote(selectedFeature.properties?.id)} 
                className="flex items-center gap-2"
                style={{ backgroundColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}
              >
                <ThumbsUp size={16} />
                Support
              </Button>
              <span className="text-sm text-gray-600 font-medium">
                {(selectedFeature.properties?.reactions || 0) + (feedback[selectedFeature.properties?.id]?.votes || 0)} reactions
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={16} 
                  style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }} />
                <span className="font-semibold text-sm" 
                  style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
                  Comments
                </span>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment(selectedFeature.properties?.id)}
                />
                <Button
                  onClick={() => handleComment(selectedFeature.properties?.id)}
                  style={{ backgroundColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}
                >
                  Post
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2">
                {(feedback[selectedFeature.properties?.id]?.comments || []).map((c, i) => (
                  <div key={i} className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                    {c}
                  </div>
                ))}
                {(!feedback[selectedFeature.properties?.id]?.comments || 
                  feedback[selectedFeature.properties?.id]?.comments.length === 0) && (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No comments yet. Be the first to share!
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 text-xs text-gray-600 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-md">
        SILAS • Stoneclough Initiative for Local & Autonomous Systems
      </footer>
    </div>
  );
}
