'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { CategoryKey } from '@/config/categories'

export interface Pin {
  id: string
  title: string
  description?: string
  lat: number
  lng: number
  type: CategoryKey
  category?: string
  photos?: string[]
  metadata?: Record<string, any>
  created_at: string
  created_by?: string
  likes?: number
  comments?: number
  status: 'active' | 'pending' | 'archived'
}

interface PinState {
  pins: Pin[]
  selectedPin: Pin | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setPins: (pins: Pin[]) => void
  setSelectedPin: (pin: Pin | null) => void
  addPin: (pin: Omit<Pin, 'id' | 'created_at'>) => Promise<Pin | null>
  updatePin: (id: string, updates: Partial<Pin>) => Promise<void>
  deletePin: (id: string) => Promise<void>
  fetchPins: () => Promise<void>
  
  // Utility
  getPinsByType: (type: string) => Pin[]
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
      
      const newPin = {
        ...pinData,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        status: 'active' as const,
        likes: 0,
        comments: 0
      }

      // Check proximity (3m rule)
      const { pins } = get()
      const tooClose = pins.some(p => {
        const distance = Math.sqrt(
          Math.pow((p.lat - newPin.lat) * 111000, 2) + 
          Math.pow((p.lng - newPin.lng) * 111000 * Math.cos(newPin.lat * Math.PI / 180), 2)
        )
        return distance < 3 // 3 meters
      })

      if (tooClose) {
        set({ error: 'Pin too close to existing pin (3m minimum)', isLoading: false })
        return null
      }

      // Save to Supabase
      const { data, error } = await supabase
        .from('pins')
        .insert([{
          id: newPin.id,
          title: newPin.title,
          description: newPin.description,
          lat: newPin.lat,
          lng: newPin.lng,
          type: newPin.type,
          category: newPin.category,
          photos: newPin.photos || [],
          metadata: newPin.metadata || {},
          created_at: newPin.created_at,
          created_by: newPin.created_by,
          status: newPin.status
        }])
        .select()
        .single()

      if (error) throw error

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
      
      const { error } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', id)

      if (error) throw error

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
      
      const { error } = await supabase
        .from('pins')
        .delete()
        .eq('id', id)

      if (error) throw error

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
      
      const { data, error } = await supabase
        .from('pins')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      const pins: Pin[] = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        lat: row.lat,
        lng: row.lng,
        type: row.type,
        category: row.category,
        photos: row.photos || [],
        metadata: row.metadata || {},
        created_at: row.created_at,
        created_by: row.created_by,
        likes: row.likes || 0,
        comments: row.comments || 0,
        status: row.status
      }))

      set({ pins, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch pins', 
        isLoading: false 
      })
    }
  },

  getPinsByType: (type) => {
    const { pins } = get()
    return pins.filter(pin => pin.type === type)
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
