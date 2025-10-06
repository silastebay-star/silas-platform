import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import Papa from "papaparse";
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Calendar, MapPin, Users, TrendingUp, Vote, MessageCircle, X } from 'lucide-react';
import silasLogo from './assets/silas-logo.png';
import './App.css';

/**
 * SILAS - Immersive Community Platform
 * Stoneclough Initiative for Local & Autonomous Systems
 * Theme: #4c764c
 */

const MAPBOX_TOKEN = "pk.eyJ1Ijoic2lsYXN0ZWJheSIsImEiOiJjbWdhemRoanIwdm5nMm5yMGtueXBhbmcxIn0.vJn_5sGNt1X4QM4Je7wPFg";
const MAPBOX_STYLE = "mapbox://styles/silastebay/cmgaznfkx000f01qu43308dzx";
const THEME = "#4c764c";

// MapboxCentral Component - Handles the map visualization
function MapboxCentral({ csvUrl, onSelect }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_STYLE,
      center: [-2.3769, 53.5526], // Stoneclough coordinates
      zoom: 13,
      maxBounds: [[-2.5, 53.4], [-2.2, 53.7]], // Lock map to region boundaries
    });

    const loadMapData = async () => {
      try {
        // Load CSV data
        const csvRes = await fetch(csvUrl);
        const csvText = await csvRes.text();
        const parsedCsv = Papa.parse(csvText, { header: true }).data;

        // Create a simple marker for Stoneclough
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundImage = `url(${silasLogo})`;
        el.style.width = '40px';
        el.style.height = '40px';
        el.style.backgroundSize = 'cover';
        el.style.cursor = 'pointer';
        el.style.borderRadius = '50%';
        el.style.border = `3px solid ${THEME}`;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([-2.3769, 53.5526])
          .addTo(map);

        el.addEventListener('click', () => {
          onSelect({
            properties: {
              name: "Stoneclough Community",
              description: "A vibrant community focused on sustainable growth and local autonomy",
              population: parsedCsv.find(row => row.Variable === "Population")?.["Selected area"] || "4,300",
              households: parsedCsv.find(row => row.Variable === "Number of households")?.["Selected area"] || "1,900",
            }
          });
        });

      } catch (error) {
        console.error("Error loading map data:", error);
      }
    };

    map.on('load', loadMapData);

    mapRef.current = map;
    return () => map.remove();
  }, [csvUrl, onSelect]);

  return <div ref={mapContainer} className="absolute inset-0 z-0" />;
}

// Main SILAS Platform Component
export default function SilasPlatform() {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const csvPath = "/area_data.csv";
  const [showCalendar, setShowCalendar] = useState(true);
  const [showPolls, setShowPolls] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [feedback, setFeedback] = useState({});
  const [commentText, setCommentText] = useState("");

  const handleVote = (id) => {
    setFeedback((prev) => ({
      ...prev,
      [id]: { votes: (prev[id]?.votes || 0) + 1, comments: prev[id]?.comments || [] },
    }));
  };

  const handleComment = (id) => {
    if (!commentText.trim()) return;
    setFeedback((prev) => ({
      ...prev,
      [id]: { votes: prev[id]?.votes || 0, comments: [...(prev[id]?.comments || []), commentText] },
    }));
    setCommentText("");
  };

  const events = [
    { id: 1, name: "Faith Gathering", time: "Sunday 10am", location: "Community Center" },
    { id: 2, name: "Market Collective", time: "Wednesday 2pm", location: "Town Square" },
    { id: 3, name: "Environmental Project", time: "Saturday 1pm", location: "Green Space" },
  ];

  const directoryItems = [
    { id: 1, name: "Local Businesses", count: 45, icon: "🏪" },
    { id: 2, name: "Community Groups", count: 12, icon: "👥" },
    { id: 3, name: "Faith Organizations", count: 8, icon: "⛪" },
    { id: 4, name: "Environmental Projects", count: 6, icon: "🌱" },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-100">
      <MapboxCentral csvUrl={csvPath} onSelect={setSelectedFeature} />

      {/* Navigation Header */}
      <header className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border-2 transition-all hover:shadow-2xl" style={{ borderColor: THEME }}>
        <img src={silasLogo} alt="SILAS Logo" className="h-8 w-8 mr-3" />
        <div className="font-bold text-xl mr-8" style={{ color: THEME }}>SILAS</div>
        <nav className="flex gap-6 text-sm text-gray-700 font-medium">
          <button 
            onClick={() => {setShowCalendar(!showCalendar); setShowPolls(false); setShowDirectory(false);}} 
            className="flex items-center gap-2 hover:text-black transition-colors"
            style={{ color: showCalendar ? THEME : undefined }}
          >
            <Calendar size={16} />
            Calendar
          </button>
          <button 
            onClick={() => {setShowPolls(!showPolls); setShowCalendar(false); setShowDirectory(false);}} 
            className="flex items-center gap-2 hover:text-black transition-colors"
            style={{ color: showPolls ? THEME : undefined }}
          >
            <Vote size={16} />
            Polls
          </button>
          <button 
            onClick={() => {setShowDirectory(!showDirectory); setShowCalendar(false); setShowPolls(false);}} 
            className="flex items-center gap-2 hover:text-black transition-colors"
            style={{ color: showDirectory ? THEME : undefined }}
          >
            <Users size={16} />
            Directory
          </button>
          <button className="flex items-center gap-2 hover:text-black transition-colors">
            <TrendingUp size={16} />
            Pulse
          </button>
        </nav>
      </header>

      {/* Calendar Overlay */}
      {showCalendar && (
        <Card className="absolute bottom-6 left-6 z-10 w-96 bg-white/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ borderColor: THEME }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: THEME }}>
                <Calendar size={20} />
                Community Calendar
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCalendar(false)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="font-semibold text-gray-900">{event.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{event.time}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={12} />
                    {event.location}
                  </div>
                  <Button size="sm" className="mt-2 w-full" style={{ backgroundColor: THEME }}>
                    RSVP
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Polls Overlay */}
      {showPolls && (
        <Card className="absolute bottom-6 right-6 z-10 w-96 bg-white/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ borderColor: THEME }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: THEME }}>
                <Vote size={20} />
                Community Poll
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowPolls(false)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 mb-4 font-medium">
              Which project should receive funding next?
            </div>
            <div className="space-y-2">
              {["Local Garden Expansion", "Youth Cultural Centre", "Eco-Restoration Project"].map((option, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start text-left hover:bg-gray-50 transition-colors"
                  onClick={() => handleVote(`poll-${idx}`)}
                >
                  <span className="flex-1">{option}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {feedback[`poll-${idx}`]?.votes || 0} votes
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Directory Overlay */}
      {showDirectory && (
        <Card className="absolute top-24 left-6 z-10 w-80 bg-white/95 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-left-4 duration-300" style={{ borderColor: THEME }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2" style={{ color: THEME }}>
                <Users size={20} />
                Community Directory
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDirectory(false)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {directoryItems.map(item => (
                <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.count} entries</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Details Popup */}
      {selectedFeature && (
        <Card className="absolute top-24 right-6 z-10 w-[420px] bg-white/98 backdrop-blur-md shadow-2xl border-2 animate-in fade-in slide-in-from-right-4 duration-300" style={{ borderColor: THEME }}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle style={{ color: THEME }}>
                {selectedFeature.properties?.name || "Community Area"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedFeature(null)}>
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 mb-4">
              {selectedFeature.properties?.description || "No details available."}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Population</div>
                <div className="text-lg font-bold" style={{ color: THEME }}>
                  {selectedFeature.properties?.population || "N/A"}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Households</div>
                <div className="text-lg font-bold" style={{ color: THEME }}>
                  {selectedFeature.properties?.households || "N/A"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <Button 
                onClick={() => handleVote(selectedFeature.properties?.name)} 
                className="flex items-center gap-2"
                style={{ backgroundColor: THEME }}
              >
                <Vote size={16} />
                Support
              </Button>
              <span className="text-sm text-gray-600 font-medium">
                {feedback[selectedFeature.properties?.name]?.votes || 0} votes
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={16} style={{ color: THEME }} />
                <span className="font-semibold text-sm" style={{ color: THEME }}>Community Comments</span>
              </div>
              
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleComment(selectedFeature.properties?.name)}
                />
                <Button
                  onClick={() => handleComment(selectedFeature.properties?.name)}
                  style={{ backgroundColor: THEME }}
                >
                  Submit
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-2">
                {(feedback[selectedFeature.properties?.name]?.comments || []).map((c, i) => (
                  <div key={i} className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                    {c}
                  </div>
                ))}
                {(!feedback[selectedFeature.properties?.name]?.comments || feedback[selectedFeature.properties?.name]?.comments.length === 0) && (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No comments yet. Be the first to share your thoughts!
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
