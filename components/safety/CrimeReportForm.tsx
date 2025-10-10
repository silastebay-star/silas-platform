/**
 * CrimeReportForm Component
 * Form for users to submit crime reports.
 */

'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CrimeReportFormProps {
  onClose: () => void
  onSubmit: (reportData: any) => Promise<void>
}

export default function CrimeReportForm({ onClose, onSubmit }: CrimeReportFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'theft',
    location: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('You must be logged in to submit a report.')
      return
    }
    if (!formData.title.trim()) {
      alert('Please enter a title for the report.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        reporter_id: user.id,
      })
      setFormData({
        title: '',
        description: '',
        type: 'theft',
        location: '',
      })
      onClose()
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Failed to submit report.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Submit Crime Report</h3>

      {/* Title */}
      <div>
        <Label htmlFor="title">Report Title *</Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Bicycle stolen from park"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Provide details about the incident..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      {/* Type */}
      <div>
        <Label htmlFor="type">Incident Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select incident type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="theft">Theft</SelectItem>
            <SelectItem value="vandalism">Vandalism</SelectItem>
            <SelectItem value="assault">Assault</SelectItem>
            <SelectItem value="harassment">Harassment</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location */}
      <div>
        <Label htmlFor="location">Location of Incident *</Label>
        <Input
          id="location"
          type="text"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="e.g., Main Street Park"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Report'}
        </Button>
      </div>
    </form>
  )
}
