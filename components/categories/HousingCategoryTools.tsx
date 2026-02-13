/**
 * Housing Category Tools Component
 * Specialized tools for housing market analysis, affordability tracking, and development planning
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Home, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  Building,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Download,
  RefreshCw,
  Search,
  Filter,
  Calculator,
  FileText,
  Camera,
  Phone
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface HousingMarketData {
  id: string
  area_name: string
  median_price: number
  price_change_1y: number
  price_change_3m: number
  average_rent: number
  rent_change_1y: number
  affordability_index: number
  inventory_count: number
  days_on_market: number
  price_per_sqft: number
  last_updated: string
}

interface AffordabilityMetrics {
  median_income: number
  median_home_price: number
  affordability_ratio: number
  recommended_income: number
  monthly_payment: number
  down_payment_needed: number
  affordable_price_range: {
    min: number
    max: number
  }
}

interface DevelopmentProject {
  id: string
  name: string
  type: 'residential' | 'commercial' | 'mixed_use' | 'affordable_housing'
  status: 'proposed' | 'approved' | 'under_construction' | 'completed'
  units: number
  affordable_units: number
  developer: string
  estimated_completion: string
  budget: number
  location: {
    latitude: number
    longitude: number
    address: string
  }
  community_impact: {
    jobs_created: number
    tax_revenue: number
    infrastructure_investment: number
  }
}

interface HousingPolicy {
  id: string
  title: string
  description: string
  type: 'zoning' | 'affordability' | 'development' | 'rent_control' | 'tax_incentive'
  status: 'draft' | 'under_review' | 'approved' | 'implemented'
  effective_date: string
  impact_area: string
  expected_outcomes: string[]
}

interface HousingCategoryToolsProps {
  pinId?: string
  location?: { latitude: number; longitude: number }
  className?: string
}

export default function HousingCategoryTools({ 
  pinId, 
  location,
  className 
}: HousingCategoryToolsProps) {
  const [activeTab, setActiveTab] = useState('market')
  const [marketData, setMarketData] = useState<HousingMarketData[]>([])
  const [affordability, setAffordability] = useState<AffordabilityMetrics | null>(null)
  const [developments, setDevelopments] = useState<DevelopmentProject[]>([])
  const [policies, setPolicies] = useState<HousingPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArea, setSelectedArea] = useState<string>('')
  const [incomeInput, setIncomeInput] = useState<number>(50000)

  useEffect(() => {
    fetchHousingData()
  }, [pinId, location])

  const fetchHousingData = async () => {
    try {
      setLoading(true)
      
      const [marketRes, affordabilityRes, developmentsRes, policiesRes] = await Promise.all([
        fetch(`/api/housing/market${location ? `?lat=${location.latitude}&lng=${location.longitude}` : ''}`),
        fetch(`/api/housing/affordability?income=${incomeInput}`),
        fetch(`/api/housing/developments${pinId ? `?pin_id=${pinId}` : ''}`),
        fetch('/api/housing/policies')
      ])

      if (marketRes.ok) {
        const marketDataRes = await marketRes.json()
        setMarketData(marketDataRes)
      }

      if (affordabilityRes.ok) {
        const affordabilityData = await affordabilityRes.json()
        setAffordability(affordabilityData)
      }

      if (developmentsRes.ok) {
        const developmentsData = await developmentsRes.json()
        setDevelopments(developmentsData)
      }

      if (policiesRes.ok) {
        const policiesData = await policiesRes.json()
        setPolicies(policiesData)
      }

    } catch (error) {
      console.error('Error fetching housing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAffordability = async () => {
    try {
      const response = await fetch(`/api/housing/affordability?income=${incomeInput}`)
      if (response.ok) {
        const data = await response.json()
        setAffordability(data)
      }
    } catch (error) {
      console.error('Error calculating affordability:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'under_construction': return 'bg-blue-500 text-white'
      case 'approved': return 'bg-purple-500 text-white'
      case 'proposed': return 'bg-orange-500 text-white'
      case 'implemented': return 'bg-green-500 text-white'
      case 'under_review': return 'bg-yellow-500 text-white'
      case 'draft': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'affordable_housing': return 'bg-green-600 text-white'
      case 'residential': return 'bg-blue-600 text-white'
      case 'commercial': return 'bg-purple-600 text-white'
      case 'mixed_use': return 'bg-orange-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-600" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-600" />
    return <BarChart3 className="w-4 h-4 text-gray-600" />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Home className="w-5 h-5 text-silas-green" />
                <span>Housing Market Tools</span>
              </CardTitle>
              <CardDescription>
                Analyze housing market trends, track affordability, and monitor development projects
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={fetchHousingData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Housing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Median Home Price</p>
                <p className="text-2xl font-bold">
                  £{marketData[0]?.median_price.toLocaleString() || '0'}
                </p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(marketData[0]?.price_change_1y || 0)}
                  <span className="text-xs text-gray-500">
                    {marketData[0]?.price_change_1y > 0 ? '+' : ''}{marketData[0]?.price_change_1y.toFixed(1)}% YoY
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rent</p>
                <p className="text-2xl font-bold">
                  £{marketData[0]?.average_rent.toLocaleString() || '0'}/mo
                </p>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(marketData[0]?.rent_change_1y || 0)}
                  <span className="text-xs text-gray-500">
                    {marketData[0]?.rent_change_1y > 0 ? '+' : ''}{marketData[0]?.rent_change_1y.toFixed(1)}% YoY
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Affordability Index</p>
                <p className="text-2xl font-bold">
                  {marketData[0]?.affordability_index || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {marketData[0]?.affordability_index > 100 ? 'Affordable' : 'Challenging'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Developments</p>
                <p className="text-2xl font-bold">
                  {developments.filter(d => ['approved', 'under_construction'].includes(d.status)).length}
                </p>
                <p className="text-xs text-gray-500">
                  {developments.reduce((sum, d) => sum + d.units, 0)} total units
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="affordability">Affordability</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="policy">Policy</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Housing Market Analysis</CardTitle>
              <CardDescription>
                Current market conditions and trends by area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData.map(area => (
                  <div key={area.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">{area.area_name}</h3>
                        <p className="text-sm text-gray-600">
                          Updated {formatDistanceToNow(new Date(area.last_updated), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Median Price</label>
                          <div className="flex items-center space-x-2">
                            <p className="text-xl font-bold">£{area.median_price.toLocaleString()}</p>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(area.price_change_1y)}
                              <span className="text-sm text-gray-500">
                                {area.price_change_1y > 0 ? '+' : ''}{area.price_change_1y.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Price per sq ft</label>
                          <p className="font-medium">£{area.price_per_sqft}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Average Rent</label>
                          <div className="flex items-center space-x-2">
                            <p className="text-xl font-bold">£{area.average_rent.toLocaleString()}</p>
                            <div className="flex items-center space-x-1">
                              {getTrendIcon(area.rent_change_1y)}
                              <span className="text-sm text-gray-500">
                                {area.rent_change_1y > 0 ? '+' : ''}{area.rent_change_1y.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Inventory</label>
                          <p className="font-medium">{area.inventory_count} homes</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Days on Market</label>
                          <p className="text-xl font-bold">{area.days_on_market}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Affordability Index</label>
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.min(area.affordability_index, 200) / 2} className="flex-1" />
                            <span className="text-sm font-medium">{area.affordability_index}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {marketData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No market data available</p>
                    <p className="text-sm">Market analysis will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="affordability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Affordability Calculator</CardTitle>
              <CardDescription>
                Calculate housing affordability based on income
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label>Annual Household Income</Label>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <Input
                      type="number"
                      value={incomeInput}
                      onChange={(e) => setIncomeInput(parseInt(e.target.value) || 0)}
                      placeholder="50000"
                    />
                  </div>
                </div>
                <Button onClick={calculateAffordability} className="bg-silas-green hover:bg-silas-green/90">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate
                </Button>
              </div>

              {affordability && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Affordability Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Affordability Ratio:</span>
                        <span className="font-medium">
                          {affordability.affordability_ratio.toFixed(1)}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Recommended Income:</span>
                        <span className="font-medium">
                          £{affordability.recommended_income.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly Payment:</span>
                        <span className="font-medium">
                          £{affordability.monthly_payment.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Down Payment Needed:</span>
                        <span className="font-medium">
                          £{affordability.down_payment_needed.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Affordable Price Range</h3>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-center">
                        <p className="text-sm text-green-700 mb-2">Recommended Budget</p>
                        <p className="text-2xl font-bold text-green-800">
                          £{affordability.affordable_price_range.min.toLocaleString()} - 
                          £{affordability.affordable_price_range.max.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {affordability.affordability_ratio > 5 
                          ? "Housing costs may be challenging with current income. Consider increasing income or looking at lower-priced areas."
                          : "Housing appears affordable within recommended guidelines."
                        }
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <div className="grid gap-4">
            {developments.map(project => (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{project.name}</h3>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getTypeColor(project.type)}>
                          {project.type.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Total Units</label>
                          <p className="text-xl font-bold">{project.units}</p>
                          <p className="text-xs text-gray-500">
                            {project.affordable_units} affordable units
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Developer</label>
                          <p className="font-medium">{project.developer}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Budget</label>
                          <p className="font-medium">£{project.budget.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">Jobs Created</p>
                          <p className="font-bold text-blue-800">
                            {project.community_impact.jobs_created}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700">Tax Revenue</p>
                          <p className="font-bold text-green-800">
                            £{project.community_impact.tax_revenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm text-purple-700">Infrastructure Investment</p>
                          <p className="font-bold text-purple-800">
                            £{project.community_impact.infrastructure_investment.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Completion: {format(new Date(project.estimated_completion), 'MMM yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{project.location.address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {developments.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Development Projects</h3>
                  <p className="text-gray-600">
                    Development projects will be displayed here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="policy" className="space-y-4">
          <div className="grid gap-4">
            {policies.map(policy => (
              <Card key={policy.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{policy.title}</h3>
                        <Badge className={getStatusColor(policy.status)}>
                          {policy.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{policy.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Impact Area</label>
                          <p className="font-medium">{policy.impact_area}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Effective Date</label>
                          <p className="font-medium">
                            {format(new Date(policy.effective_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Expected Outcomes</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {policy.expected_outcomes.map((outcome, index) => (
                            <li key={index}>{outcome}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <Badge variant="outline" className="capitalize">
                      {policy.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {policies.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Housing Policies</h3>
                  <p className="text-gray-600">
                    Housing policies and regulations will be displayed here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
