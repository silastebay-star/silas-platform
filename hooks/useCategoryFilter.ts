'use client'

import { useState, useEffect, useMemo } from 'react'
import { usePinsStore } from '@/store/pins'
import { CategoryKey } from '@/config/categories'

export function useCategoryFilter() {
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null)
  const [overlays, setOverlays] = useState<string[]>([])
  const { pins } = usePinsStore()

  // Filter pins based on active category
  const filteredPins = useMemo(() => {
    if (!activeCategory) {
      return pins
    }
    
    return pins.filter(pin => pin.type === activeCategory)
  }, [pins, activeCategory])

  // Get category statistics
  const categoryStats = useMemo(() => {
    const stats: Record<CategoryKey, number> = {
      community: 0,
      faith: 0,
      projects: 0,
      economy: 0,
      events: 0,
      data_ai: 0,
      issues: 0
    }

    pins.forEach(pin => {
      if (pin.type in stats) {
        stats[pin.type as CategoryKey]++
      }
    })

    return stats
  }, [pins])

  // Toggle overlay
  const toggleOverlay = (overlay: string) => {
    setOverlays(prev => 
      prev.includes(overlay) 
        ? prev.filter(o => o !== overlay)
        : [...prev, overlay]
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setActiveCategory(null)
    setOverlays([])
  }

  // Set category and clear overlays
  const selectCategory = (category: CategoryKey | null) => {
    setActiveCategory(category)
    // Keep overlays when switching categories
  }

  return {
    activeCategory,
    setActiveCategory: selectCategory,
    overlays,
    toggleOverlay,
    clearFilters,
    filteredPins,
    categoryStats,
    totalPins: pins.length,
    hasFilters: activeCategory !== null || overlays.length > 0
  }
}
