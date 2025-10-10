/**
 * Demographic Visualization Component
 * Interactive charts and graphs for census data analysis
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3, 
  PieChart, 
  LineChart,
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  GraduationCap,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Info,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemographicData {
  area_id: string
  area_name: string
  population: number
  population_density: number
  median_age: number
  median_income: number
  education_bachelor_plus: number
  housing_median_value: number
  unemployment_rate: number
  poverty_rate: number
  households_with_children: number
  senior_population: number
  foreign_born: number
  owner_occupied_housing: number
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
  }[]
}

interface DemographicVisualizationProps {
  data?: DemographicData[]
  bounds?: [[number, number], [number, number]]
  className?: string
}

export default function DemographicVisualization({ 
  data = [], 
  bounds,
  className 
}: DemographicVisualizationProps) {
  const [activeTab, setActiveTab] = useState('population')
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar')
  const [selectedMetric, setSelectedMetric] = useState('population')
  const [loading, setLoading] = useState(false)
  const [comparisonMode, setComparisonMode] = useState(false)

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (data.length === 0) return null

    const totalPopulation = data.reduce((sum, d) => sum + d.population, 0)
    const avgIncome = data.reduce((sum, d) => sum + d.median_income, 0) / data.length
    const avgAge = data.reduce((sum, d) => sum + d.median_age, 0) / data.length
    const avgEducation = data.reduce((sum, d) => sum + d.education_bachelor_plus, 0) / data.length
    const avgUnemployment = data.reduce((sum, d) => sum + d.unemployment_rate, 0) / data.length

    return {
      totalPopulation,
      avgIncome,
      avgAge,
      avgEducation,
      avgUnemployment,
      areas: data.length
    }
  }, [data])

  // Generate chart data based on selected metric and type
  const chartData = useMemo(() => {
    if (data.length === 0) return null

    const sortedData = [...data].sort((a, b) => b[selectedMetric as keyof DemographicData] as number - (a[selectedMetric as keyof DemographicData] as number))
    const topAreas = sortedData.slice(0, 10) // Show top 10 areas

    switch (chartType) {
      case 'bar':
        return {
          labels: topAreas.map(d => d.area_name),
          datasets: [{
            label: getMetricLabel(selectedMetric),
            data: topAreas.map(d => d[selectedMetric as keyof DemographicData] as number),
            backgroundColor: getMetricColor(selectedMetric),
            borderColor: getMetricColor(selectedMetric, true),
            borderWidth: 1
          }]
        }

      case 'pie':
        // For pie charts, group data into ranges
        const ranges = createRanges(data, selectedMetric)
        return {
          labels: ranges.map(r => r.label),
          datasets: [{
            label: getMetricLabel(selectedMetric),
            data: ranges.map(r => r.count),
            backgroundColor: [
              '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'
            ]
          }]
        }

      case 'line':
        // For line charts, show trend across sorted areas
        return {
          labels: topAreas.map((_, index) => `Area ${index + 1}`),
          datasets: [{
            label: getMetricLabel(selectedMetric),
            data: topAreas.map(d => d[selectedMetric as keyof DemographicData] as number),
            borderColor: getMetricColor(selectedMetric, true),
            backgroundColor: getMetricColor(selectedMetric),
            tension: 0.4
          }]
        }

      default:
        return null
    }
  }, [data, selectedMetric, chartType])

  const getMetricLabel = (metric: string) => {
    const labels: { [key: string]: string } = {
      population: 'Population',
      population_density: 'Population Density (per km²)',
      median_age: 'Median Age (years)',
      median_income: 'Median Income (£)',
      education_bachelor_plus: 'Bachelor\'s Degree or Higher (%)',
      housing_median_value: 'Median Housing Value (£)',
      unemployment_rate: 'Unemployment Rate (%)',
      poverty_rate: 'Poverty Rate (%)',
      households_with_children: 'Households with Children (%)',
      senior_population: 'Senior Population (%)',
      foreign_born: 'Foreign Born (%)',
      owner_occupied_housing: 'Owner Occupied Housing (%)'
    }
    return labels[metric] || metric
  }

  const getMetricColor = (metric: string, border = false) => {
    const colors: { [key: string]: string } = {
      population: border ? '#3b82f6' : '#3b82f680',
      median_income: border ? '#22c55e' : '#22c55e80',
      education_bachelor_plus: border ? '#8b5cf6' : '#8b5cf680',
      housing_median_value: border ? '#f97316' : '#f9731680',
      unemployment_rate: border ? '#ef4444' : '#ef444480',
      median_age: border ? '#ec4899' : '#ec489980'
    }
    return colors[metric] || (border ? '#6b7280' : '#6b728080')
  }

  const createRanges = (data: DemographicData[], metric: string) => {
    const values = data.map(d => d[metric as keyof DemographicData] as number)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    const step = range / 5

    const ranges = []
    for (let i = 0; i < 5; i++) {
      const rangeMin = min + (step * i)
      const rangeMax = min + (step * (i + 1))
      const count = values.filter(v => v >= rangeMin && v < rangeMax).length
      
      ranges.push({
        label: `${rangeMin.toFixed(0)} - ${rangeMax.toFixed(0)}`,
        count,
        min: rangeMin,
        max: rangeMax
      })
    }

    return ranges
  }

  const exportData = () => {
    const exportData = {
      summary: summaryStats,
      detailed_data: data,
      chart_data: chartData,
      bounds,
      generated_at: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `demographic-analysis-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const refreshData = async () => {
    if (!bounds) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams({
        bbox: `${bounds[0][1]},${bounds[0][0]},${bounds[1][1]},${bounds[1][0]}`,
        analysis_type: 'demographic_summary'
      })
      
      const response = await fetch(`/api/census/data?${params}`)
      if (response.ok) {
        const newData = await response.json()
        // This would update the parent component's data
        console.log('Refreshed data:', newData)
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-silas-green" />
                <span>Demographic Analysis</span>
              </CardTitle>
              <CardDescription>
                Interactive visualization of census and demographic data
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Population</p>
                  <p className="text-2xl font-bold">{summaryStats.totalPopulation.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Income</p>
                  <p className="text-2xl font-bold">£{summaryStats.avgIncome.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Age</p>
                  <p className="text-2xl font-bold">{summaryStats.avgAge.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Education Rate</p>
                  <p className="text-2xl font-bold">{summaryStats.avgEducation.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Unemployment</p>
                  <p className="text-2xl font-bold">{summaryStats.avgUnemployment.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Areas</p>
                  <p className="text-2xl font-bold">{summaryStats.areas}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Metric:</label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="population">Population</SelectItem>
                  <SelectItem value="median_income">Median Income</SelectItem>
                  <SelectItem value="education_bachelor_plus">Education Level</SelectItem>
                  <SelectItem value="housing_median_value">Housing Value</SelectItem>
                  <SelectItem value="unemployment_rate">Unemployment Rate</SelectItem>
                  <SelectItem value="median_age">Median Age</SelectItem>
                  <SelectItem value="poverty_rate">Poverty Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Chart Type:</label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Badge variant="outline" className="ml-auto">
              {data.length} data points
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Visualization */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="population">Demographics</TabsTrigger>
          <TabsTrigger value="economics">Economics</TabsTrigger>
          <TabsTrigger value="housing">Housing</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="population" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Population Demographics</CardTitle>
              <CardDescription>
                Age distribution, education levels, and population characteristics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.length > 0 ? (
                <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-50">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-600">Interactive Chart</p>
                    <p className="text-sm text-gray-500">
                      Showing {getMetricLabel(selectedMetric)} as {chartType} chart
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Chart visualization would be rendered here using a library like Chart.js or D3
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-50">
                  <div className="text-center">
                    <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-600">No Data Available</p>
                    <p className="text-sm text-gray-500">
                      Select an area on the map to view demographic data
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="economics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Income Distribution</CardTitle>
                <CardDescription>Median household income across areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">Income Chart</p>
                    <p className="text-sm text-gray-500">Interactive income visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Statistics</CardTitle>
                <CardDescription>Unemployment and poverty rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border rounded-lg bg-gray-50">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                    <p className="font-medium">Employment Chart</p>
                    <p className="text-sm text-gray-500">Employment trends visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="housing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Housing Market Analysis</CardTitle>
              <CardDescription>
                Property values, ownership rates, and housing characteristics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center">
                  <Home className="w-16 h-16 mx-auto mb-4 text-orange-500" />
                  <p className="text-lg font-medium text-gray-600">Housing Analysis</p>
                  <p className="text-sm text-gray-500">
                    Comprehensive housing market visualization
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Area Comparison</CardTitle>
              <CardDescription>
                Compare multiple demographic metrics across different areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center border rounded-lg bg-gray-50">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                  <p className="text-lg font-medium text-gray-600">Comparison Analysis</p>
                  <p className="text-sm text-gray-500">
                    Side-by-side comparison of selected areas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Quality Alert */}
      {data.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This analysis is based on {data.length} census areas. 
            Data is sourced from official census records and updated regularly.
            For the most current information, please refer to official government statistics.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
