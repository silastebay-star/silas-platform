'use client'

import { useState, useEffect } from 'react'
import { useMap } from 'react-map-gl/mapbox'
import { handleError } from '@/lib/error-handling'

export function CensusDataVisualization() {
  const { current: map } = useMap()
  const [censusData, setCensusData] = useState<any[] | null>(null)
  const [showLayer, setShowLayer] = useState(false)

  useEffect(() => {
    const fetchCensusData = async () => {
      try {
        const response = await fetch('/api/census-data')
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch census data')
        }
        const data = await response.json()
        setCensusData(data)
      } catch (error: any) {
        handleError(error, 'CensusDataVisualization - fetchCensusData', true)
      }
    }

    fetchCensusData()
  }, [])

  useEffect(() => {
    if (!map || !censusData) return

    const sourceId = 'census-data-source'
    const layerId = 'census-data-layer'

    if (showLayer) {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: censusData.map(d => ({
              type: 'Feature',
              geometry: d.geom,
              properties: {
                population: d.population,
                deprivation_index: d.deprivation_index,
              },
            })),
          },
        })
      }

      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: 'fill',
          source: sourceId,
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'deprivation_index'],
              0, '#ffffcc',
              0.1, '#ffeda0',
              0.2, '#fed976',
              0.3, '#feb24c',
              0.4, '#fd8d3c',
              0.5, '#fc4e2a',
              0.6, '#e31a1c',
              0.7, '#bd0026',
              0.8, '#800026',
            ],
            'fill-opacity': 0.7,
          },
        })
      }
    } else {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
      }
    }
  }, [map, censusData, showLayer])

    return (

      <div className="absolute top-24 right-4 bg-white p-4 rounded-lg shadow-lg">

        <h3 className="font-bold mb-2">Census Data</h3>

        <label className="flex items-center space-x-2 mb-4">

          <input

            type="checkbox"

            checked={showLayer}

            onChange={() => setShowLayer(!showLayer)}

          />

          <span>Show Deprivation Index</span>

        </label>

  

        {showLayer && (

          <div className="space-y-1">

            <p className="text-sm font-medium">Deprivation Index</p>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#800026]"></div>

              <span className="text-xs">High (0.8+)</span>

            </div>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#bd0026]"></div>

              <span className="text-xs">0.7 - 0.8</span>

            </div>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#e31a1c]"></div>

              <span className="text-xs">0.6 - 0.7</span>

            </div>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#fc4e2a]"></div>

              <span className="text-xs">0.5 - 0.6</span>

            </div>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#fd8d3c]"></div>

              <span className="text-xs">0.4 - 0.5</span>

            </div>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#feb24c]"></div>

              <span className="text-xs">0.3 - 0.4</span>

            </div>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#fed976]"></div>

              <span className="text-xs">0.2 - 0.3</span>

            </div>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#ffeda0]"></div>

              <span className="text-xs">0.1 - 0.2</span>

            </div>

            <div className="flex items-center space-x-2">

              <div className="w-4 h-4 bg-[#ffffcc]"></div>

              <span className="text-xs">Low (0 - 0.1)</span>

            </div>

          </div>

        )}

      </div>

    )

  }

  