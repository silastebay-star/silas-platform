'use client'

import { useState } from 'react'

export function StoryMap() {
  const [selectedYear, setSelectedYear] = useState(2024)

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedYear(parseInt(e.target.value, 10))
  }

  return (
    <div>
      <h3 className="font-bold mb-4">Story Map</h3>
      <p className="text-sm text-gray-600 mb-4">
        This is a placeholder for the Story Map feature. Please provide the historical data (e.g., GeoJSON files) to implement this feature.
      </p>
      <div className="flex items-center space-x-4">
        <input
          type="range"
          min="1900"
          max="2024"
          value={selectedYear}
          onChange={handleYearChange}
          className="w-full"
        />
        <span>{selectedYear}</span>
      </div>
    </div>
  )
}