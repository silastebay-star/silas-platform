/**
 * Event Calendar Component
 */

'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { cn } from '@/lib/utils'
import { useEvents } from '../hooks/useEvents'
import type { CommunityEvent, CalendarView } from '../types'

interface EventCalendarProps {
  onEventClick?: (event: CommunityEvent) => void
  onCreateEvent?: (date?: Date) => void
  className?: string
}

export default function EventCalendar({
  onEventClick,
  onCreateEvent,
  className = ""
}: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView['view']>('month')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Fetch events for the current month
  const startDate = startOfMonth(currentDate)
  const endDate = endOfMonth(currentDate)

  const { events, loading } = useEvents({
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    status: ['active'],
    is_public: true
  })

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CommunityEvent[]> = {}

    events.forEach(event => {
      const dateKey = format(new Date(event.start_time), 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })

    return grouped
  }, [events])

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return []
    const dateKey = format(selectedDate, 'yyyy-MM-dd')
    return eventsByDate[dateKey] || []
  }, [selectedDate, eventsByDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev =>
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const renderEventCard = (event: CommunityEvent) => (
    <Card
      key={event.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onEventClick?.(event)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{event.title}</h4>
            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
              <Clock className="h-3 w-3" />
              {format(new Date(event.start_time), 'HH:mm')}
              {event.location && (
                <>
                  <MapPin className="h-3 w-3 ml-1" />
                  <span className="truncate">{event.location}</span>
                </>
              )}
            </div>
            {event.current_attendees > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                <Users className="h-3 w-3" />
                {event.current_attendees} attending
              </div>
            )}
          </div>
          <Badge
            variant="outline"
            className="text-xs"
            style={{
              borderColor: event.category_info?.color || '#3B82F6',
              color: event.category_info?.color || '#3B82F6'
            }}
          >
            {event.category_info?.icon} {event.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Calendar Header */}
      <Card className="">
        <CardHeader className="">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Community Events
              </CardTitle>
              <CardDescription className="">
                {format(currentDate, 'MMMM yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                className=""
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className=""
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                className=""
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {onCreateEvent && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onCreateEvent(selectedDate)}
                  className="bg-silas-green hover:bg-silas-green/90"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Event
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="">
            <CardContent className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="w-full"
                modifiers={{
                  hasEvents: (date) => {
                    const dateKey = format(date, 'yyyy-MM-dd')
                    return !!eventsByDate[dateKey]?.length
                  }
                }}
                modifiersStyles={{
                  hasEvents: {
                    backgroundColor: '#10B981',
                    color: 'white',
                    fontWeight: 'bold'
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Events */}
        <div>
          <Card className="">
            <CardHeader className="">
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a date'}
              </CardTitle>
              <CardDescription className="">
                {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="">
              <div className="space-y-3">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map(renderEventCard)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No events on this date</p>
                    {onCreateEvent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateEvent(selectedDate)}
                        className=""
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Event
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
