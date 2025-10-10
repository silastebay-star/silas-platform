import { create } from 'zustand'
import { CategoryKey } from '@/config/categories'
import { validatePinLocation } from '@/lib/boundary-utils'

export interface Pin {
  id: string
  title: string
  description?: string
  geom: { type: 'Point', coordinates: [number, number] } // GeoJSON Point
  categories: string[]
  project_id?: string
  group_id?: string
  author_id: string
  status: 'draft' | 'proposed' | 'published' | 'archived' | 'deleted'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string

  // Client-side computed fields
  lat?: number
  lng?: number
}

interface PinState {
  pins: Pin[]
  selectedPin: Pin | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setPins: (pins: Pin[]) => void
  setSelectedPin: (pin: Pin | null) => void
  addPin: (pinData: any) => Promise<Pin | null>
  updatePin: (id: string, updates: Partial<Pin>) => Promise<void>
  deletePin: (id: string) => Promise<void>
  fetchPins: () => Promise<void>
  
  // Utility
  getPinsByCategory: (category: CategoryKey) => Pin[]
  getPinsNearLocation: (lat: number, lng: number, radiusMeters: number) => Pin[]
}

export const usePinsStore = create<PinState>((set, get) => ({
  pins: [],
  selectedPin: null,
  isLoading: false,
  error: null,

  setPins: (pins) => set({ pins }),
  
  setSelectedPin: (pin) => set({ selectedPin: pin }),

  addPin: async (pinData) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add pin')
      }

      const newPin = await response.json()

      const { pins } = get()
      const updatedPins = [...pins, newPin]
      set({ pins: updatedPins, isLoading: false })
      return newPin
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add pin', 
        isLoading: false 
      })
      return null
    }
  },

  updatePin: async (id, updates) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch(`/api/pins/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update pin')
      }

      const { pins } = get()
      const updatedPins = pins.map(pin => 
        pin.id === id ? { ...pin, ...updates } : pin
      )
      
      set({ pins: updatedPins, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update pin', 
        isLoading: false 
      })
    }
  },

  deletePin: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch(`/api/pins/${id}`, { method: 'DELETE' })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete pin')
      }

      const { pins } = get()
      const updatedPins = pins.filter(pin => pin.id !== id)
      
      set({ pins: updatedPins, isLoading: false, selectedPin: null })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete pin', 
        isLoading: false 
      })
    }
  },

  fetchPins: async () => {
    set({ isLoading: true, error: null })

    try {
      const response = await fetch('/api/pins')
      if (!response.ok) {
        throw new Error('Failed to fetch pins')
      }
      const pins: Pin[] = await response.json()

      set({ pins, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch pins', 
        isLoading: false 
      })
    }
  },

  getPinsByCategory: (category: CategoryKey) => {
    const { pins } = get()
    return pins.filter(pin => pin.categories.includes(category))
  },

  getPinsNearLocation: (lat, lng, radiusMeters) => {
    const { pins } = get()
    return pins.filter(pin => {
      const distance = Math.sqrt(
        Math.pow((pin.lat - lat) * 111000, 2) + 
        Math.pow((pin.lng - lng) * 111000 * Math.cos(lat * Math.PI / 180), 2)
      )
      return distance <= radiusMeters
    })
  }
}))
