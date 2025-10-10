/**
 * Data-Driven Insights Component
 * AI-powered insights and recommendations based on census data analysis
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Target,
  Users,
  Home,
  DollarSign,
  GraduationCap,
  MapPin,
  Zap,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CensusInsight {
  id: string
  type: 'opportunity' | 'concern' | 'trend' | 'recommendation'
  category: 'demographics' | 'economics' | 'housing' | 'education' | 'infrastructure'
  title: string
  description: string
  confidence: number
  impact: 'low' | 'medium' | 'high'
  data_points: string[]
  recommendations?: string[]
  related_areas?: string[]
}

interface TrendAnalysis {
  metric: string
  direction: 'increasing' | 'decreasing' | 'stable'
  rate: number
  significance: 'low' | 'medium' | 'high'
  projection: {
    short_term: number
    long_term: number
  }
}

interface DataDrivenInsightsProps {
  censusData?: any[]
  bounds?: [[number, number], [number, number]]
  selectedMetrics?: string[]
  className?: string
}

export default function DataDrivenInsights({ 
  censusData = [], 
  bounds,
  selectedMetrics = [],
  className 
}: DataDrivenInsightsProps) {
  const [insights, setInsights] = useState<CensusInsight[]>([])
  const [trends, setTrends] = useState<TrendAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('insights')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Generate insights when data changes
  useEffect(() => {
    if (censusData.length > 0) {
      generateInsights()
    }
  }, [censusData, selectedMetrics])

  const generateInsights = async () => {
    setLoading(true)
    try {
      // In production, this would call an AI service
      // For now, we'll generate insights based on data patterns
      const generatedInsights = analyzeDataPatterns(censusData)
      const generatedTrends = analyzeTrends(censusData)
      
      setInsights(generatedInsights)
      setTrends(generatedTrends)
    } catch (error) {
      console.error('Error generating insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeDataPatterns = (data: any[]): CensusInsight[] => {
    const insights: CensusInsight[] = []

    if (data.length === 0) return insights

    // Calculate statistics
    const avgIncome = data.reduce((sum, d) => sum + d.properties.median_income, 0) / data.length
    const avgEducation = data.reduce((sum, d) => sum + d.properties.education_bachelor_plus, 0) / data.length
    const avgUnemployment = data.reduce((sum, d) => sum + d.properties.unemployment_rate, 0) / data.length
    const avgHousingValue = data.reduce((sum, d) => sum + d.properties.housing_median_value, 0) / data.length

    // Income inequality analysis
    const incomes = data.map(d => d.properties.median_income).sort((a, b) => a - b)
    const incomeGap = incomes[incomes.length - 1] / incomes[0]
    
    if (incomeGap > 3) {
      insights.push({
        id: 'income-inequality',
        type: 'concern',
        category: 'economics',
        title: 'Significant Income Inequality Detected',
        description: `There is a ${incomeGap.toFixed(1)}x difference between highest and lowest income areas, indicating potential economic disparities.`,
        confidence: 85,
        impact: 'high',
        data_points: ['median_income', 'poverty_rate'],
        recommendations: [
          'Consider targeted economic development programs',
          'Explore affordable housing initiatives',
          'Investigate job training and education programs'
        ]
      })
    }

    // Education opportunity analysis
    if (avgEducation < 30) {
      insights.push({
        id: 'education-opportunity',
        type: 'opportunity',
        category: 'education',
        title: 'Education Enhancement Opportunity',
        description: `Only ${avgEducation.toFixed(1)}% of residents have bachelor's degrees or higher, below national average.`,
        confidence: 78,
        impact: 'medium',
        data_points: ['education_bachelor_plus', 'median_income'],
        recommendations: [
          'Establish community college partnerships',
          'Create adult education programs',
          'Develop vocational training initiatives'
        ]
      })
    }

    // Housing affordability analysis
    const affordabilityRatio = avgHousingValue / avgIncome
    if (affordabilityRatio > 5) {
      insights.push({
        id: 'housing-affordability',
        type: 'concern',
        category: 'housing',
        title: 'Housing Affordability Crisis',
        description: `Housing costs are ${affordabilityRatio.toFixed(1)}x median income, indicating severe affordability challenges.`,
        confidence: 92,
        impact: 'high',
        data_points: ['housing_median_value', 'median_income', 'owner_occupied_housing'],
        recommendations: [
          'Implement inclusionary zoning policies',
          'Develop affordable housing programs',
          'Consider rent stabilization measures'
        ]
      })
    }

    // Employment analysis
    if (avgUnemployment > 8) {
      insights.push({
        id: 'employment-concern',
        type: 'concern',
        category: 'economics',
        title: 'High Unemployment Rate',
        description: `Unemployment rate of ${avgUnemployment.toFixed(1)}% is above healthy economic levels.`,
        confidence: 88,
        impact: 'high',
        data_points: ['unemployment_rate', 'poverty_rate', 'median_income'],
        recommendations: [
          'Attract new businesses and employers',
          'Develop job training programs',
          'Support entrepreneurship initiatives'
        ]
      })
    }

    // Demographic opportunity
    const youngPopulation = data.filter(d => d.properties.median_age < 35).length / data.length
    if (youngPopulation > 0.6) {
      insights.push({
        id: 'young-population',
        type: 'opportunity',
        category: 'demographics',
        title: 'Young Population Advantage',
        description: `${(youngPopulation * 100).toFixed(1)}% of areas have young populations, indicating growth potential.`,
        confidence: 75,
        impact: 'medium',
        data_points: ['median_age', 'population'],
        recommendations: [
          'Develop youth-oriented amenities',
          'Create startup incubation programs',
          'Invest in modern infrastructure'
        ]
      })
    }

    return insights
  }

  const analyzeTrends = (data: any[]): TrendAnalysis[] => {
    // Mock trend analysis - in production, this would use historical data
    return [
      {
        metric: 'Population Growth',
        direction: 'increasing',
        rate: 2.3,
        significance: 'medium',
        projection: { short_term: 5.2, long_term: 12.8 }
      },
      {
        metric: 'Median Income',
        direction: 'increasing',
        rate: 3.1,
        significance: 'high',
        projection: { short_term: 7.8, long_term: 18.5 }
      },
      {
        metric: 'Housing Costs',
        direction: 'increasing',
        rate: 5.7,
        significance: 'high',
        projection: { short_term: 12.1, long_term: 31.2 }
      },
      {
        metric: 'Education Level',
        direction: 'increasing',
        rate: 1.8,
        significance: 'medium',
        projection: { short_term: 4.2, long_term: 9.8 }
      }
    ]
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'concern': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'trend': return <BarChart3 className="w-5 h-5 text-blue-600" />
      case 'recommendation': return <Lightbulb className="w-5 h-5 text-yellow-600" />
      default: return <Info className="w-5 h-5 text-gray-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-l-green-500 bg-green-50'
      case 'concern': return 'border-l-red-500 bg-red-50'
      case 'trend': return 'border-l-blue-500 bg-blue-50'
      case 'recommendation': return 'border-l-yellow-500 bg-yellow-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-orange-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />
    }
  }

  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory)

  const exportInsights = () => {
    const exportData = {
      insights: filteredInsights,
      trends,
      summary: {
        total_insights: insights.length,
        high_impact: insights.filter(i => i.impact === 'high').length,
        opportunities: insights.filter(i => i.type === 'opportunity').length,
        concerns: insights.filter(i => i.type === 'concern').length
      },
      generated_at: new Date().toISOString(),
      data_source: 'census_analysis'
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `census-insights-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-silas-green" />
                <span>Data-Driven Insights</span>
              </CardTitle>
              <CardDescription>
                AI-powered analysis and recommendations based on census data
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={generateInsights} disabled={loading}>
                <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={exportInsights}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Opportunities</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.type === 'opportunity').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Concerns</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.type === 'concern').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">High Impact</p>
                <p className="text-2xl font-bold">
                  {insights.filter(i => i.impact === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {/* Category Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium">Filter by category:</label>
                <div className="flex flex-wrap gap-2">
                  {['all', 'demographics', 'economics', 'housing', 'education', 'infrastructure'].map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "bg-silas-green hover:bg-silas-green/90" : ""}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights List */}
          <div className="space-y-4">
            {filteredInsights.map(insight => (
              <Card key={insight.id} className={cn("border-l-4", getInsightColor(insight.type))}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{insight.title}</h3>
                        <p className="text-gray-600 mt-1">{insight.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getImpactColor(insight.impact)}>
                        {insight.impact} impact
                      </Badge>
                      <Badge variant="outline">
                        {insight.confidence}% confidence
                      </Badge>
                    </div>
                  </div>

                  {insight.recommendations && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Recommendations:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Based on:</span>
                      {insight.data_points.map(point => (
                        <Badge key={point} variant="outline" className="text-xs">
                          {point.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {insight.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredInsights.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedCategory === 'all' 
                      ? 'Load census data to generate insights'
                      : `No insights found for ${selectedCategory} category`
                    }
                  </p>
                  {censusData.length === 0 && (
                    <Button onClick={generateInsights} className="bg-silas-green hover:bg-silas-green/90">
                      <Zap className="w-4 h-4 mr-2" />
                      Generate Insights
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4">
            {trends.map((trend, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getTrendIcon(trend.direction)}
                      <div>
                        <h3 className="font-semibold">{trend.metric}</h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {trend.direction} at {trend.rate}% annually
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(
                      trend.significance === 'high' ? 'bg-red-500' :
                      trend.significance === 'medium' ? 'bg-orange-500' : 'bg-green-500',
                      'text-white'
                    )}>
                      {trend.significance} significance
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Short-term (2 years)</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={Math.min(trend.projection.short_term, 100)} className="flex-1" />
                        <span className="text-sm font-medium">
                          {trend.projection.short_term > 0 ? '+' : ''}{trend.projection.short_term}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Long-term (5 years)</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Progress value={Math.min(trend.projection.long_term, 100)} className="flex-1" />
                        <span className="text-sm font-medium">
                          {trend.projection.long_term > 0 ? '+' : ''}{trend.projection.long_term}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Priority Recommendations</CardTitle>
              <CardDescription>
                Actionable recommendations based on data analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights
                  .filter(i => i.recommendations && i.impact === 'high')
                  .map(insight => (
                    <div key={insight.id} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{insight.title}</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {insight.recommendations?.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
