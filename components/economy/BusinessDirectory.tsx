'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Business {
  id: string
  name: string
  description: string
  category: string
  address: string
}

export function BusinessDirectory() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [category, setCategory] = useState('all')

  const fetchBusinesses = async (category: string) => {
    setIsLoading(true)
    try {
      const url = category === 'all' ? '/api/businesses' : `/api/businesses?category=${category}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch businesses')
      }
      const data = await response.json()
      setBusinesses(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinesses(category)
  }, [category])

  if (isLoading) {
    return <div>Loading businesses...</div>
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="food">Food & Drink</SelectItem>
            <SelectItem value="services">Services</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => (
          <div key={business.id} className="border rounded-lg p-4">
            <h3 className="font-bold">{business.name}</h3>
            <p className="text-sm text-gray-600">{business.description}</p>
            <p className="text-xs text-gray-500 mt-2">{business.address}</p>
          </div>
        ))}
      </div>
    </div>
  )
}