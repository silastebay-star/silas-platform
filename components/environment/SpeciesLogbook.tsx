'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Species {
  id: string
  name: string
  description: string
  image_url: string
}

export function SpeciesLogbook() {
  const [species, setSpecies] = useState<Species[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchSpecies = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/species')
      if (!response.ok) {
        throw new Error('Failed to fetch species')
      }
      const data = await response.json()
      setSpecies(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSpecies()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/species', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, image_url: imageUrl }),
      })

      if (!response.ok) {
        throw new Error('Failed to add species')
      }

      const newSpecies = await response.json()
      setSpecies([newSpecies[0], ...species])
      setName('')
      setDescription('')
      setImageUrl('')
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>Loading species...</div>
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter species name..."
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
            placeholder="Enter species description..."
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL..."
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Adding species...' : 'Add Species'}
        </Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {species.map((s) => (
          <div key={s.id} className="border rounded-lg p-4">
            <img src={s.image_url} alt={s.name} className="w-full h-48 object-cover rounded-md mb-4" />
            <h3 className="font-bold">{s.name}</h3>
            <p className="text-sm text-gray-600">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}