/**
 * Census Data Overlay Component
 * Interactive census data visualization on the map with filtering and analysis
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  Users, 
  Home, 
  GraduationCap,
  DollarSign,
  MapPin,
  Filter,
  Download,
  Info,
  Eye,
  EyeOff,
  Layers,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CensusDataLayer {
  id: string
  name: string
  description: string
  type: 'choropleth' | 'heatmap' | 'points' | 'boundaries'
  category: 'demographics' | 'housing' | 'economics' | 'education' | 'transportation'
  dataField: string
  colorScale: string[]
  visible: boolean
  opacity: number
  minValue?: number
  maxValue?: number
  unit?: string
}

interface CensusDataPoint {
  id: string
  geoid: string
  name: string
  geometry: any
  properties: {
    population: number
    households: number
    median_income: number
    median_age: number
    education_bachelor_plus: number
    housing_median_value: number
    unemployment_rate: number
    poverty_rate: number
    commute_time_avg: number
    [key: string]: any
  }
}

interface CensusDataOverlayProps {
  map?: any
  bounds?: [[number, number], [number, number]]
  onDataSelect?: (data: CensusDataPoint) => void
  className?: string
}

export default function CensusDataOverlay({ 
  map, 
  bounds, 
  onDataSelect,
  className 
}: CensusDataOverlayProps) {
  const [layers, setLayers] = useState<CensusDataLayer[]>([])
  const [censusData, setCensusData] = useState<CensusDataPoint[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('layers')
  const [filterValues, setFilterValues] = useState<{ [key: string]: [number, number] }>({})

  // Initialize default layers
  useEffect(() => {
    const defaultLayers: CensusDataLayer[] = [
      {
        id: 'population-density',
        name: 'Population Density',
        description: 'Population per square kilometer',
        type: 'choropleth',
        category: 'demographics',
        dataField: 'population_density',
        colorScale: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
        visible: false,
        opacity: 0.7,
        unit: 'people/km²'
      },
      {
        id: 'median-income',
        name: 'Median Household Income',
        description: 'Median household income by census tract',
        type: 'choropleth',
        category: 'economics',
        dataField: 'median_income',
        colorScale: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
        visible: false,
        opacity: 0.7,
        unit: '£'
      },
      {
        id: 'education-level',
        name: 'Education Level',
        description: 'Percentage with bachelor\'s degree or higher',
        type: 'choropleth',
        category: 'education',
        dataField: 'education_bachelor_plus',
        colorScale: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
        visible: false,
        opacity: 0.7,
        unit: '%'
      },
      {
        id: 'housing-value',
        name: 'Median Housing Value',
        description: 'Median value of owner-occupied housing units',
        type: 'choropleth',
        category: 'housing',
        dataField: 'housing_median_value',
        colorScale: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
        visible: false,
        opacity: 0.7,
        unit: '£'
      },
      {
        id: 'unemployment-rate',
        name: 'Unemployment Rate',
        description: 'Percentage of labor force unemployed',
        type: 'choropleth',
        category: 'economics',
        dataField: 'unemployment_rate',
        colorScale: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
        visible: false,
        opacity: 0.7,
        unit: '%'
      },
      {
        id: 'age-distribution',
        name: 'Median Age',
        description: 'Median age of population',
        type: 'choropleth',
        category: 'demographics',
        dataField: 'median_age',
        colorScale: ['#f1eef6', '#d7b5d8', '#df65b0', '#dd1c77', '#980043'],
        visible: false,
        opacity: 0.7,
        unit: 'years'
      }
    ]
    
    setLayers(defaultLayers)
  }, [])

  // Fetch census data when bounds change
  useEffect(() => {
    if (bounds) {
      fetchCensusData()
    }
  }, [bounds])

  const fetchCensusData = async () => {
    if (!bounds) return
    
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        bbox: `${bounds[0][1]},${bounds[0][0]},${bounds[1][1]},${bounds[1][0]}`,
        level: 'tract' // Census tract level
      })
      
      const response = await fetch(`/api/census/data?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCensusData(data)
        
        // Calculate min/max values for each layer
        const updatedLayers = layers.map(layer => {
          const values = data.map((d: CensusDataPoint) => d.properties[layer.dataField]).filter((v: any) => v != null)
          return {
            ...layer,
            minValue: Math.min(...values),
            maxValue: Math.max(...values)
          }
        })
        setLayers(updatedLayers)
        
        // Initialize filter values
        const filters: { [key: string]: [number, number] } = {}
        updatedLayers.forEach(layer => {
          if (layer.minValue !== undefined && layer.maxValue !== undefined) {
            filters[layer.id] = [layer.minValue, layer.maxValue]
          }
        })
        setFilterValues(filters)
      }
    } catch (error) {
      console.error('Error fetching census data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ))
  }, [])

  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity: opacity / 100 }
        : layer
    ))
  }, [])

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'demographics': return <Users className="w-4 h-4" />
      case 'housing': return <Home className="w-4 h-4" />
      case 'economics': return <DollarSign className="w-4 h-4" />
      case 'education': return <GraduationCap className="w-4 h-4" />
      case 'transportation': return <MapPin className="w-4 h-4" />
      default: return <BarChart3 className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'demographics': return 'text-blue-600'
      case 'housing': return 'text-green-600'
      case 'economics': return 'text-purple-600'
      case 'education': return 'text-orange-600'
      case 'transportation': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const exportData = async () => {
    try {
      const visibleLayers = layers.filter(l => l.visible)
      const exportData = {
        layers: visibleLayers,
        data: censusData,
        bounds,
        timestamp: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `census-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const visibleLayers = layers.filter(l => l.visible)
  const layersByCategory = layers.reduce((acc, layer) => {
    if (!acc[layer.category]) acc[layer.category] = []
    acc[layer.category].push(layer)
    return acc
  }, {} as { [key: string]: CensusDataLayer[] })

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-silas-green" />
                <span>Census Data Overlay</span>
              </CardTitle>
              <CardDescription>
                Visualize demographic and economic data on the map
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Badge variant="outline">
                {visibleLayers.length} active
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {loading && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Loading census data for the current map area...
          </AlertDescription>
        </Alert>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="layers">Data Layers</TabsTrigger>
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="space-y-4">
          {Object.entries(layersByCategory).map(([category, categoryLayers]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span className={getCategoryColor(category)}>
                    {getCategoryIcon(category)}
                  </span>
                  <span className="capitalize">{category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categoryLayers.map(layer => (
                  <div key={layer.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Switch
                          checked={layer.visible}
                          onCheckedChange={() => toggleLayer(layer.id)}
                        />
                        <div>
                          <Label className="font-medium">{layer.name}</Label>
                          <p className="text-xs text-gray-600">{layer.description}</p>
                        </div>
                      </div>
                      {layer.visible && (
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {Math.round(layer.opacity * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {layer.visible && (
                      <div className="ml-8 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Label className="text-xs">Opacity:</Label>
                          <Slider
                            value={[layer.opacity * 100]}
                            onValueChange={([value]) => updateLayerOpacity(layer.id, value)}
                            max={100}
                            min={10}
                            step={10}
                            className="flex-1"
                          />
                        </div>
                        
                        {layer.minValue !== undefined && layer.maxValue !== undefined && (
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Min: {layer.minValue.toLocaleString()}{layer.unit}</span>
                            <span>Max: {layer.maxValue.toLocaleString()}{layer.unit}</span>
                          </div>
                        )}
                        
                        {/* Color scale preview */}
                        <div className="flex h-3 rounded overflow-hidden">
                          {layer.colorScale.map((color, index) => (
                            <div
                              key={index}
                              className="flex-1"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5" />
                <span>Data Filters</span>
              </CardTitle>
              <CardDescription>
                Filter census data by value ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {visibleLayers.map(layer => {
                const filterRange = filterValues[layer.id]
                if (!filterRange || layer.minValue === undefined || layer.maxValue === undefined) {
                  return null
                }
                
                return (
                  <div key={layer.id} className="space-y-2">
                    <Label className="font-medium">{layer.name}</Label>
                    <div className="space-y-2">
                      <Slider
                        value={filterRange}
                        onValueChange={(value) => setFilterValues(prev => ({
                          ...prev,
                          [layer.id]: value as [number, number]
                        }))}
                        min={layer.minValue}
                        max={layer.maxValue}
                        step={(layer.maxValue - layer.minValue) / 100}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{filterRange[0].toLocaleString()}{layer.unit}</span>
                        <span>{filterRange[1].toLocaleString()}{layer.unit}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {visibleLayers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Filter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No active layers to filter</p>
                  <p className="text-sm">Enable data layers to access filtering options</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Data Analysis</span>
              </CardTitle>
              <CardDescription>
                Statistical insights from census data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {censusData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Population Statistics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Population:</span>
                        <span className="font-medium">
                          {censusData.reduce((sum, d) => sum + d.properties.population, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Households:</span>
                        <span className="font-medium">
                          {censusData.reduce((sum, d) => sum + d.properties.households, 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Median Age:</span>
                        <span className="font-medium">
                          {(censusData.reduce((sum, d) => sum + d.properties.median_age, 0) / censusData.length).toFixed(1)} years
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Economic Indicators</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Avg. Median Income:</span>
                        <span className="font-medium">
                          £{(censusData.reduce((sum, d) => sum + d.properties.median_income, 0) / censusData.length).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Unemployment:</span>
                        <span className="font-medium">
                          {(censusData.reduce((sum, d) => sum + d.properties.unemployment_rate, 0) / censusData.length).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg. Housing Value:</span>
                        <span className="font-medium">
                          £{(censusData.reduce((sum, d) => sum + d.properties.housing_median_value, 0) / censusData.length).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No census data available</p>
                  <p className="text-sm">Zoom to a specific area to load census data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
