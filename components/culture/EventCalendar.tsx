'use client'

import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { usePinsStore } from '@/store/pins'

export function EventCalendar() {
  const { pins, fetchPins } = usePinsStore()
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  useEffect(() => {
    const culturePins = pins.filter(pin => pin.categories.includes('culture'))
    const eventData = culturePins.map(pin => ({
      date: new Date(pin.created_at),
      title: pin.title,
    }))
    setEvents(eventData)
  }, [pins])

  const eventDays = events.map(event => event.date)

  return (
    <DayPicker
      mode="multiple"
      selected={eventDays}
      modifiers={{ booked: eventDays }}
      modifiersStyles={{ booked: { color: 'white', backgroundColor: '#4C764C' } }}
    />
  )
}