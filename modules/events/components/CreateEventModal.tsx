/**
 * Create Event Modal Component
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon, MapPin, Clock, Users, Tag, Image as ImageIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useEvents } from '../hooks/useEvents'
import { useFeedback } from '@/lib/user-feedback'
import type { CreateEventData, EventCategory } from '../types'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  pinId?: string // Optional link to a map pin
  pinLocation?: {
    title: string
    address?: string
  }
}

const DEFAULT_CATEGORIES: EventCategory[] = [
  { id: '1', name: 'Community Meeting', color: '#3B82F6', icon: '👥', created_at: '' },
  { id: '2', name: 'Workshop', color: '#10B981', icon: '🛠️', created_at: '' },
  { id: '3', name: 'Social Event', color: '#F59E0B', icon: '🎉', created_at: '' },
  { id: '4', name: 'Volunteer Work', color: '#8B5CF6', icon: '🤝', created_at: '' },
  { id: '5', name: 'Environment', color: '#059669', icon: '🌱', created_at: '' },
  { id: '6', name: 'Arts & Culture', color: '#DC2626', icon: '🎨', created_at: '' },
  { id: '7', name: 'Sports & Recreation', color: '#EA580C', icon: '⚽', created_at: '' },
  { id: '8', name: 'Education', color: '#7C3AED', icon: '📚', created_at: '' }
]

export default function CreateEventModal({
  isOpen,
  onClose,
  initialDate,
  pinId,
  pinLocation
}: CreateEventModalProps) {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    category: '',
    start_time: '',
    end_time: '',
    location: '',
    max_attendees: undefined,
    is_recurring: false,
    is_public: true,
    requires_approval: false,
    tags: [],
    pin_id: pinId
  })

  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createEvent } = useEvents()
  const feedback = useFeedback()

  // Set initial date if provided
  useEffect(() => {
    if (initialDate) {
      setStartDate(initialDate)
      setEndDate(initialDate)
    }
  }, [initialDate])

  // Set initial location if pin is provided
  useEffect(() => {
    if (pinLocation) {
      setFormData(prev => ({
        ...prev,
        location: pinLocation.address || pinLocation.title
      }))
    }
  }, [pinLocation])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (!startDate) {
      newErrors.start_date = 'Start date is required'
    }

    if (!endDate) {
      newErrors.end_date = 'End date is required'
    }

    if (!startTime) {
      newErrors.start_time = 'Start time is required'
    }

    if (!endTime) {
      newErrors.end_time = 'End time is required'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    if (startDate && endDate && startTime && endTime) {
      const startDateTime = new Date(`${format(startDate, 'yyyy-MM-dd')}T${startTime}`)
      const endDateTime = new Date(`${format(endDate, 'yyyy-MM-dd')}T${endTime}`)

      if (endDateTime <= startDateTime) {
        newErrors.end_time = 'End time must be after start time'
      }
    }

    if (formData.max_attendees && formData.max_attendees < 1) {
      newErrors.max_attendees = 'Max attendees must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      feedback.formValidationError()
      return
    }

    try {
      setIsSubmitting(true)

      const startDateTime = new Date(`${format(startDate!, 'yyyy-MM-dd')}T${startTime}`)
      const endDateTime = new Date(`${format(endDate!, 'yyyy-MM-dd')}T${endTime}`)

      const eventData: CreateEventData = {
        ...formData,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        metadata: {
          ...formData.metadata,
          pin_location: pinLocation
        }
      }

      await createEvent(eventData)

      // Reset form and close modal
      resetForm()
      onClose()

    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      start_time: '',
      end_time: '',
      location: '',
      max_attendees: undefined,
      is_recurring: false,
      is_public: true,
      requires_approval: false,
      tags: [],
      pin_id: pinId
    })
    setStartDate(undefined)
    setEndDate(undefined)
    setStartTime('')
    setEndTime('')
    setErrors({})
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="">
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-silas-green" />
            Create Community Event
          </DialogTitle>
          <DialogDescription className="">
            Create a new event for the community. Your event will be visible to all community members.
            {pinLocation && (
              <div className="flex items-center gap-1 mt-2 text-sm text-silas-green">
                <MapPin className="h-4 w-4" />
                Linked to: {pinLocation.title}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Event Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a clear, descriptive title for your event"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="">
                {DEFAULT_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Start Date & Time *
              </Label>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                        errors.start_date && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                  className={errors.start_time ? 'border-red-500' : ''}
                />
              </div>
              {(errors.start_date || errors.start_time) && (
                <p className="text-sm text-red-500">{errors.start_date || errors.start_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Date & Time *
              </Label>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                        errors.end_date && "border-red-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                  className={errors.end_time ? 'border-red-500' : ''}
                />
              </div>
              {(errors.end_date || errors.end_time) && (
                <p className="text-sm text-red-500">{errors.end_date || errors.end_time}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location *
            </Label>
            <Input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter the event location or address"
              className={errors.location ? 'border-red-500' : ''}
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Event Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a detailed description of your event, including what to expect, what to bring, and any special instructions..."
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500">
              Minimum 20 characters. Be specific about the event details.
            </p>
          </div>

          {/* Max Attendees */}
          <div className="space-y-2">
            <Label htmlFor="max_attendees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Maximum Attendees (Optional)
            </Label>
            <Input
              id="max_attendees"
              type="number"
              min="1"
              value={formData.max_attendees || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                ...prev,
                max_attendees: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              placeholder="Leave empty for unlimited"
              className={errors.max_attendees ? 'border-red-500' : ''}
            />
            {errors.max_attendees && (
              <p className="text-sm text-red-500">{errors.max_attendees}</p>
            )}
          </div>

          {/* Event Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: !!checked }))}
                className=""
              />
              <Label htmlFor="is_public" className="text-sm">
                Public Event (visible to all community members)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_approval: !!checked }))}
                className=""
              />
              <Label htmlFor="requires_approval" className="text-sm">
                Require approval for RSVPs
              </Label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              disabled={isSubmitting}
              className=""
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="default"
              disabled={isSubmitting}
              className="bg-silas-green hover:bg-silas-green/90"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
