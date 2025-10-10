'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Resident {
  name: string
  address: string
  contact_info: {
    email: string
    phone: string
  }
}

export function ResidentRegistry() {
  const [resident, setResident] = useState<Resident | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchResident = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/residents')
      if (!response.ok) {
        throw new Error('Failed to fetch resident data')
      }
      const data = await response.json()
      setResident(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchResident()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resident) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resident),
      })

      if (!response.ok) {
        throw new Error('Failed to save resident data')
      }

      // Optionally, show a success message
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setResident(prev => (prev ? { ...prev, [name]: value } : null))
  }

  const handleContactInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setResident(prev => (
      prev
        ? {
            ...prev,
            contact_info: {
              ...prev.contact_info,
              [name]: value,
            },
          }
        : null
    ))
  }

  if (isLoading) {
    return <div>Loading resident data...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          name="name"
          value={resident?.name || ''}
          onChange={handleInputChange}
          placeholder="Enter your name..."
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          type="text"
          name="address"
          value={resident?.address || ''}
          onChange={handleInputChange}
          placeholder="Enter your address..."
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          value={resident?.contact_info?.email || ''}
          onChange={handleContactInfoChange}
          placeholder="Enter your email..."
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          name="phone"
          value={resident?.contact_info?.phone || ''}
          onChange={handleContactInfoChange}
          placeholder="Enter your phone number..."
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}