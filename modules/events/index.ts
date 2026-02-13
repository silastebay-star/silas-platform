/**
 * Community Events Module
 * 
 * Handles event creation, management, and RSVP functionality
 */

export { default as EventCalendar } from './components/EventCalendar'
export { default as EventCard } from './components/EventCard'
export { default as CreateEventModal } from './components/CreateEventModal'
export { default as EventDetail } from './components/EventDetail'

export { useEvents } from './hooks/useEvents'
export { useEventRSVP } from './hooks/useEventRSVP'

export type { CommunityEvent, EventRSVP, EventCategory, CreateEventData, UpdateEventData } from './types'
