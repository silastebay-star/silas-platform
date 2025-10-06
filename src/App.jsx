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
  BarChart3, PieChart, Activity, Calendar, FileText, Search
} from 'lucide-react';
import silasLogo from './assets/silas-logo.png';
import './App.css';

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg";
const MAPBOX_STYLE = "mapbox://styles/silastebay/cmgaznfkx000f01qu43308dzx";

const LAYER_CONFIG = {
  Economy: { 
    color: "#4c764c", 
    id: "economy", 
    icon: Briefcase,
    title: "Local Economy",
    description: "Community economic development, employment, and prosperity tracking"
  },
  Commerce: { 
    color: "#2f7a4a", 
    id: "commerce", 
    icon: Store,
    title: "Commerce & Trade",
    description: "Local businesses, markets, and commercial activity"
  },
  Faith: { 
    color: "#d2a24c", 
    id: "faith", 
    icon: Church,
    title: "Faith & Culture",
    description: "Places of worship, cultural centers, and spiritual gatherings"
  },
  Works: { 
    color: "#3c82b3", 
    id: "works", 
    icon: Hammer,
    title: "Community Works",
    description: "Projects, volunteering, and community improvement initiatives"
  },
  Circle: { 
    color: "#b35c8a", 
    id: "circle", 
    icon: Vote,
    title: "Civic Circle",
    description: "Governance, proposals, discussions, and democratic participation"
  },
  Pulse: { 
    color: "#6c4c76", 
    id: "pulse", 
    icon: Activity,
    title: "Community Pulse",
    description: "Data, metrics, KPIs, and community health indicators"
  },
  Mind: { 
    color: "#6e7a72", 
    id: "mind", 
    icon: GraduationCap,
    title: "Collective Mind",
    description: "Learning, education, AI assistance, and knowledge sharing"
  },
};

// Census data summary for Stoneclough
const CENSUS_DATA = {
  population: 4300,
  households: 1900,
  ageGroups: {
    "0-19": 1190,
    "20-39": 1140,
    "40-59": 1260,
    "60+": 710
  },
  employment: {
    employed: 2800,
    unemployed: 200,
    retired: 800
  },
  health: {
    veryGood: 2287,
    good: 1459,
    fair: 435
  },
  religion: {
    christian: 2656,
    noReligion: 1301,
    muslim: 88,
    other: 255
  },
  ethnicity: {
    white: 4121,
    asian: 84,
    black: 43,
    mixed: 76,
    other: 27
  }
};

// MapboxCentral Component
function MapboxCentral({ geojsonUrl, csvUrl, kmlUrl, onSelect, mapApiRef, activeLayer }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const boundaryPolygonRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [-2.3769, 53.5526],
      zoom: 14,
    });

    if (mapApiRef) {
      mapApiRef.current = {
        flyToCoords: (lngLat, zoom = 15) => map.flyTo({ center: lngLat, zoom }),
        fitToBounds: (bounds) => map.fitBounds(bounds),
      };
    }

    const loadAllData = async () => {
      try {
        // Load KML boundary
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
          const pad = 0.005;
          map.fitBounds(
            [[bounds[0] - pad, bounds[1] - pad], [bounds[2] + pad, bounds[3] + pad]], 
            { padding: 40 }
          );

          // Add boundary layer
          map.addSource("communityBoundary", { 
            type: "geojson", 
            data: boundaryPolygonRef.current 
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

        // Merge CSV data into GeoJSON
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
              Object.keys(LAYER_CONFIG).some(key => key.toLowerCase() === t.toLowerCase())
            );
            if (found) {
              feature.properties.layer = Object.keys(LAYER_CONFIG).find(
                key => key.toLowerCase() === found.toLowerCase()
              );
            }
          }
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
          paint: {
            "text-color": "#ffffff"
          }
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
                zoom: zoom + 1
              });
            }
          );
        });

        // Hover effects
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

        setMapLoaded(true);
      } catch (error) {
        console.error("Error loading map data:", error);
      }
    };

    map.on("load", loadAllData);

    mapRef.current = map;
    return () => map.remove();
  }, [geojsonUrl, csvUrl, kmlUrl, onSelect, mapApiRef]);

  // React to activeLayer changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.getLayer("unclustered-point")) return;

    const color = activeLayer ? LAYER_CONFIG[activeLayer]?.color : LAYER_CONFIG.Economy.color;

    // Update paint properties
    if (map.getLayer("clusters")) {
      map.setPaintProperty("clusters", "circle-color", color);
    }
    if (map.getLayer("unclustered-point")) {
      map.setPaintProperty("unclustered-point", "circle-color", color);
    }

    // Filter features by layer
    if (activeLayer && activeLayer !== "Home") {
      const layerId = LAYER_CONFIG[activeLayer]?.id || activeLayer.toLowerCase();
      const pointFilter = [
        "any", 
        ["==", ["downcase", ["get", "layer"]], activeLayer.toLowerCase()], 
        ["in", layerId, ["downcase", ["coalesce", ["get", "tags"], ""]]],
        ["==", ["downcase", ["get", "type"]], activeLayer.toLowerCase()]
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
  }, [activeLayer, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 z-0" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <Activity className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: LAYER_CONFIG.Economy.color }} />
            <p className="text-gray-600">Loading Stoneclough map...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Layer-specific platform components
function EconomyPlatform({ censusData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Employment Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Economy.color }}>
              {((censusData.employment.employed / censusData.population) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">{censusData.employment.employed} employed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Working Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Economy.color }}>
              {censusData.ageGroups["20-39"] + censusData.ageGroups["40-59"]}
            </div>
            <p className="text-xs text-gray-500">people aged 20-59</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Households</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Economy.color }}>
              {censusData.households}
            </div>
            <p className="text-xs text-gray-500">total households</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Economic Development Tools</CardTitle>
          <CardDescription>Resources for local economic growth</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Briefcase className="mr-2 h-4 w-4" />
            Job Board & Opportunities
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Skills Directory
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Economic Impact Reports
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Local Investment Tracker
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CommercePlatform({ censusData }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Local Business Directory</CardTitle>
          <CardDescription>Support local commerce and trade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8" style={{ color: LAYER_CONFIG.Commerce.color }} />
              <div>
                <div className="font-semibold">GreenRoots Cafe</div>
                <div className="text-sm text-gray-500">Cafe & Restaurant</div>
              </div>
            </div>
            <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Commerce.color }}>
              Endorse
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8" style={{ color: LAYER_CONFIG.Commerce.color }} />
              <div>
                <div className="font-semibold">Stoneclough Hardware</div>
                <div className="text-sm text-gray-500">Hardware & Tools</div>
              </div>
            </div>
            <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Commerce.color }}>
              Endorse
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commerce Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Store className="mr-2 h-4 w-4" />
            Register Your Business
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Heart className="mr-2 h-4 w-4" />
            Business Endorsements
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Mentorship Network
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Markets & Events
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FaithPlatform({ censusData }) {
  const totalReligious = censusData.population - censusData.religion.noReligion;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Christian Community</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Faith.color }}>
              {censusData.religion.christian}
            </div>
            <p className="text-xs text-gray-500">{((censusData.religion.christian / censusData.population) * 100).toFixed(1)}% of population</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Faith Diversity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Faith.color }}>
              {totalReligious}
            </div>
            <p className="text-xs text-gray-500">people of faith</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Places of Worship</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">St. Mary's Church</div>
              <Church className="h-5 w-5" style={{ color: LAYER_CONFIG.Faith.color }} />
            </div>
            <p className="text-sm text-gray-600 mb-2">Sunday service at 10am. All welcome.</p>
            <div className="flex gap-2">
              <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Faith.color }}>Amen</Button>
              <Button size="sm" variant="outline">Follow</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Faith & Culture Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Church className="mr-2 h-4 w-4" />
            Service Times & Events
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Cultural Calendar
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Interfaith Dialogue
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Heart className="mr-2 h-4 w-4" />
            Community Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function WorksPlatform() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
          <CardDescription>Community improvement initiatives</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Riverbank Restoration</div>
              <Hammer className="h-5 w-5" style={{ color: LAYER_CONFIG.Works.color }} />
            </div>
            <p className="text-sm text-gray-600 mb-2">200 native shrubs planted. Join us for the next phase!</p>
            <div className="flex gap-2">
              <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Works.color }}>Join Project</Button>
              <Button size="sm" variant="outline">Donate Materials</Button>
            </div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Community Garden</div>
              <Hammer className="h-5 w-5" style={{ color: LAYER_CONFIG.Works.color }} />
            </div>
            <p className="text-sm text-gray-600 mb-2">Growing vegetables for local families. Saturday work sessions.</p>
            <div className="flex gap-2">
              <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Works.color }}>Join Project</Button>
              <Button size="sm" variant="outline">Donate Materials</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Management Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Hammer className="mr-2 h-4 w-4" />
            Propose New Project
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Volunteer Coordination
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Project Timeline
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Resource Tracker
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CirclePlatform() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Proposals</CardTitle>
          <CardDescription>Vote and discuss community decisions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Youth Centre Proposal</div>
              <Vote className="h-5 w-5" style={{ color: LAYER_CONFIG.Circle.color }} />
            </div>
            <p className="text-sm text-gray-600 mb-2">New youth centre with sports facilities and study spaces.</p>
            <div className="flex gap-2">
              <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Circle.color }}>Vote</Button>
              <Button size="sm" variant="outline">Discuss</Button>
            </div>
            <div className="mt-2 text-xs text-gray-500">89 people support this</div>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Traffic Calming Initiative</div>
              <Vote className="h-5 w-5" style={{ color: LAYER_CONFIG.Circle.color }} />
            </div>
            <p className="text-sm text-gray-600 mb-2">Implementing traffic calming measures on Main Street.</p>
            <div className="flex gap-2">
              <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Circle.color }}>Vote</Button>
              <Button size="sm" variant="outline">Discuss</Button>
            </div>
            <div className="mt-2 text-xs text-gray-500">34 people support this</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Governance Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Vote className="mr-2 h-4 w-4" />
            Submit Proposal
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <MessageCircle className="mr-2 h-4 w-4" />
            Discussion Forum
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Voting Results
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Meeting Minutes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PulsePlatform({ censusData }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Population</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Pulse.color }}>
              {censusData.population}
            </div>
            <p className="text-xs text-gray-500">residents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: LAYER_CONFIG.Pulse.color }}>
              8.2/10
            </div>
            <p className="text-xs text-gray-500">{((censusData.health.veryGood / censusData.population) * 100).toFixed(0)}% very good health</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Community Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Employment Rate</span>
              <span className="font-semibold">{((censusData.employment.employed / censusData.population) * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{ 
                width: `${(censusData.employment.employed / censusData.population) * 100}%`,
                backgroundColor: LAYER_CONFIG.Pulse.color 
              }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Community Engagement</span>
              <span className="font-semibold">73%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 rounded-full" style={{ width: "73%", backgroundColor: LAYER_CONFIG.Pulse.color }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data & Analytics Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Census Dashboard
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <PieChart className="mr-2 h-4 w-4" />
            Demographics Report
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Community Health Metrics
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Trend Analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MindPlatform() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ask SILAS</CardTitle>
          <CardDescription>AI-powered community assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input placeholder="Ask a question about your community..." />
            <Button className="w-full" style={{ backgroundColor: LAYER_CONFIG.Mind.color }}>
              <Lightbulb className="mr-2 h-4 w-4" />
              Get AI Insights
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Paths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 border rounded-lg">
            <div className="font-semibold mb-1">Sustainable Living</div>
            <p className="text-sm text-gray-600 mb-2">Learn about eco-friendly practices</p>
            <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Mind.color }}>Start Learning</Button>
          </div>
          <div className="p-3 border rounded-lg">
            <div className="font-semibold mb-1">Community Organizing</div>
            <p className="text-sm text-gray-600 mb-2">Build effective local initiatives</p>
            <Button size="sm" style={{ backgroundColor: LAYER_CONFIG.Mind.color }}>Start Learning</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Knowledge Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <GraduationCap className="mr-2 h-4 w-4" />
            Course Library
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Knowledge Base
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Peer Learning Groups
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Resource Library
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main SILAS Platform Component
export default function SilasPlatform() {
  const [selectedFeature, setSelectedFeature] = useState(null);
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

  const LayerIcon = activeLayer ? LAYER_CONFIG[activeLayer]?.icon : Briefcase;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-50">
      {/* Map Background */}
      <div className="absolute inset-0">
        <MapboxCentral 
          geojsonUrl={geojsonPath} 
          csvUrl={csvPath} 
          kmlUrl={kmlPath} 
          onSelect={openFeaturePage} 
          mapApiRef={mapApiRef} 
          activeLayer={activeLayer} 
        />
      </div>

      {/* Top Navigation */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center bg-white/98 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border-2 transition-all" 
        style={{ borderColor: LAYER_CONFIG[activeLayer]?.color || LAYER_CONFIG.Economy.color }}>
        <img src={silasLogo} alt="SILAS" className="h-8 w-8 mr-3" />
        <div className="font-bold text-xl mr-6" 
          style={{ color: LAYER_CONFIG[activeLayer]?.color || LAYER_CONFIG.Economy.color }}>
          SILAS
        </div>
        
        {/* Layer Navigation */}
        <nav className="flex gap-2 text-sm">
          {Object.keys(LAYER_CONFIG).map((layer) => {
            const Icon = LAYER_CONFIG[layer].icon;
            return (
              <button
                key={layer}
                onClick={() => {
                  setActiveLayer(layer);
                  setSelectedFeature(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${
                  activeLayer === layer 
                    ? "shadow-lg text-white" 
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

      {/* Layer Platform Panel */}
      <div className="absolute top-24 right-6 z-30 w-[420px] max-h-[calc(100vh-140px)] overflow-y-auto">
        <Card className="bg-white/98 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-right-4 duration-300" 
          style={{ borderColor: LAYER_CONFIG[activeLayer]?.color }}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <LayerIcon size={24} style={{ color: LAYER_CONFIG[activeLayer]?.color }} />
              <div>
                <CardTitle>{LAYER_CONFIG[activeLayer]?.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {LAYER_CONFIG[activeLayer]?.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeLayer === "Economy" && <EconomyPlatform censusData={CENSUS_DATA} />}
            {activeLayer === "Commerce" && <CommercePlatform censusData={CENSUS_DATA} />}
            {activeLayer === "Faith" && <FaithPlatform censusData={CENSUS_DATA} />}
            {activeLayer === "Works" && <WorksPlatform />}
            {activeLayer === "Circle" && <CirclePlatform />}
            {activeLayer === "Pulse" && <PulsePlatform censusData={CENSUS_DATA} />}
            {activeLayer === "Mind" && <MindPlatform />}
          </CardContent>
        </Card>
      </div>

      {/* Feature Details Popup */}
      {selectedFeature && (
        <Card className="absolute top-24 left-6 z-30 w-[400px] bg-white/98 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-left-4 duration-300" 
          style={{ borderColor: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" 
                style={{ color: LAYER_CONFIG[selectedFeature.properties?.layer || "Economy"]?.color }}>
                <MapPin size={20} />
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
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-xs text-gray-600 bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg">
        SILAS • Stoneclough Initiative for Local & Autonomous Systems • Population: {CENSUS_DATA.population}
      </footer>
    </div>
  );
}
