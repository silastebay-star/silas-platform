
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePinsStore, type Pin } from '@/store/pins'

export function CreateProjectForm() {
  const { pins, fetchPins } = usePinsStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPins, setSelectedPins] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  const handlePinSelection = (pinId: string) => {
    setSelectedPins(prev =>
      prev.includes(pinId) ? prev.filter(id => id !== pinId) : [...prev, pinId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, pins: selectedPins }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      setName('')
      setDescription('')
      setSelectedPins([])
      // Optionally, redirect to the new project page
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter project name..."
          className="mt-1"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project..."
          className="mt-1"
        />
      </div>
      <div>
        <Label>Link Pins</Label>
        <div className="grid grid-cols-3 gap-4 mt-2">
          {pins.map(pin => (
            <div key={pin.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`pin-${pin.id}`}
                checked={selectedPins.includes(pin.id)}
                onChange={() => handlePinSelection(pin.id)}
              />
              <Label htmlFor={`pin-${pin.id}`}>{pin.title}</Label>
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating project...' : 'Create Project'}
      </Button>
    </form>
  )
}
