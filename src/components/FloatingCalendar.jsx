import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FloatingCalendar = ({ 
  isOpen, 
  onClose, 
  events = [], 
  onEventAdd,
  onEventClick,
  position = { x: window.innerWidth - 350, y: 100 }
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'day'
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    type: 'general'
  });

  // Mock events for demonstration
  const mockEvents = [
    {
      id: 1,
      title: 'Community Meeting',
      description: 'Monthly community planning meeting',
      startTime: new Date(Date.now() + 86400000), // Tomorrow
      endTime: new Date(Date.now() + 86400000 + 7200000), // Tomorrow + 2 hours
      location: 'Community Center',
      type: 'meeting',
      attendees: 15
    },
    {
      id: 2,
      title: 'Local Market',
      description: 'Weekly farmers market',
      startTime: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
      endTime: new Date(Date.now() + 2 * 86400000 + 14400000), // + 4 hours
      location: 'Town Square',
      type: 'social',
      attendees: 45
    },
    {
      id: 3,
      title: 'Workshop: Sustainable Living',
      description: 'Learn about eco-friendly practices',
      startTime: new Date(Date.now() + 3 * 86400000), // 3 days from now
      endTime: new Date(Date.now() + 3 * 86400000 + 10800000), // + 3 hours
      location: 'Library',
      type: 'workshop',
      attendees: 8
    }
  ];

  const allEvents = [...mockEvents, ...events];

  // Get events for current week
  const getWeekEvents = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
  };

  // Get events for current day
  const getDayEvents = () => {
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    return allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= startOfDay && eventDate <= endOfDay;
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventTypeColor = (type) => {
    const colors = {
      general: 'bg-gray-500',
      meeting: 'bg-blue-500',
      workshop: 'bg-green-500',
      social: 'bg-purple-500',
      emergency: 'bg-red-500',
      maintenance: 'bg-orange-500'
    };
    return colors[type] || colors.general;
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const handleAddEvent = () => {
    if (newEvent.title && newEvent.startTime) {
      const eventData = {
        ...newEvent,
        id: Date.now(),
        startTime: new Date(`${selectedDate.toDateString()} ${newEvent.startTime}`),
        endTime: newEvent.endTime ? new Date(`${selectedDate.toDateString()} ${newEvent.endTime}`) : null,
        attendees: 0
      };
      
      if (onEventAdd) {
        onEventAdd(eventData);
      }
      
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        location: '',
        type: 'general'
      });
      setShowAddEvent(false);
    }
  };

  if (!isOpen) return null;

  const currentEvents = viewMode === 'week' ? getWeekEvents() : getDayEvents();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Floating Calendar */}
      <div 
        className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        style={{
          left: position.x,
          top: position.y,
          width: '320px',
          maxHeight: '500px'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Community Calendar</span>
            </h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewMode === 'day' ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                viewMode === 'week' ? 'bg-white/20' : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200">
          <button
            onClick={() => viewMode === 'week' ? navigateWeek(-1) : navigateDay(-1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {viewMode === 'week' 
                ? `Week of ${formatDate(currentDate)}`
                : formatDate(currentDate)
              }
            </div>
            <div className="text-xs text-gray-500">
              {currentEvents.length} event{currentEvents.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <button
            onClick={() => viewMode === 'week' ? navigateWeek(1) : navigateDay(1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Events List */}
        <div className="max-h-80 overflow-y-auto">
          {currentEvents.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No events scheduled</p>
              <p className="text-gray-400 text-xs">Add an event to get started</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {currentEvents.map((event) => (
                <div
                  key={event.id}
                  onClick={() => onEventClick && onEventClick(event)}
                  className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(event.type)}`}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {event.title}
                      </h4>
                      
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(event.startTime)}</span>
                        {event.endTime && (
                          <>
                            <span>-</span>
                            <span>{formatTime(event.endTime)}</span>
                          </>
                        )}
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                      
                      {event.attendees > 0 && (
                        <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{event.attendees} attending</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Event Button */}
        <div className="p-3 border-t border-gray-200">
          <Button
            onClick={() => {
              setSelectedDate(currentDate);
              setShowAddEvent(true);
            }}
            className="w-full flex items-center justify-center space-x-2 text-sm"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Event</span>
          </Button>
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Event</h3>
              <button
                onClick={() => setShowAddEvent(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Community meeting, workshop, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the event"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <Input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <Input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Community center, park, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="general">General</option>
                  <option value="meeting">Meeting</option>
                  <option value="workshop">Workshop</option>
                  <option value="social">Social</option>
                  <option value="emergency">Emergency</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEvent}
                  className="flex-1"
                  disabled={!newEvent.title || !newEvent.startTime}
                >
                  Add Event
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingCalendar;
