/**
 * Business Category Tools Component
 * Specialized tools for business directory, economic development, and local commerce
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
  Building2, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Users,
  MapPin,
  Calendar,
  Clock,
  Star,
  Phone,
  Mail,
  Globe,
  BarChart3,
  PieChart,
  Target,
  Briefcase,
  ShoppingBag,
  Factory,
  Store,
  Coffee,
  Utensils,
  Car,
  Hammer,
  Heart,
  GraduationCap,
  Plus,
  Download,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Business {
  id: string
  name: string
  description: string
  category: string
  subcategory: string
  status: 'active' | 'temporarily_closed' | 'permanently_closed' | 'coming_soon'
  rating: number
  review_count: number
  contact: {
    phone?: string
    email?: string
    website?: string
    address: string
  }
  location: {
    latitude: number
    longitude: number
  }
  hours: {
    [key: string]: { open: string; close: string; closed?: boolean }
  }
  employees: number
  founded_year: number
  annual_revenue?: number
  services: string[]
  certifications: string[]
  social_impact: {
    local_jobs: number
    community_involvement: string[]
    sustainability_practices: string[]
  }
  created_at: string
  updated_at: string
}

interface EconomicIndicator {
  id: string
  name: string
  value: number
  unit: string
  change_1m: number
  change_1y: number
  trend: 'improving' | 'declining' | 'stable'
  category: 'employment' | 'revenue' | 'growth' | 'investment'
  last_updated: string
}

interface EconomicDevelopmentProject {
  id: string
  title: string
  description: string
  type: 'business_incubator' | 'infrastructure' | 'training_program' | 'investment_fund' | 'tax_incentive'
  status: 'planning' | 'active' | 'completed' | 'on_hold'
  budget: number
  spent: number
  start_date: string
  end_date: string
  beneficiaries: number
  jobs_created: number
  economic_impact: number
  partners: string[]
  milestones: {
    id: string
    title: string
    target_date: string
    completed: boolean
  }[]
}

interface BusinessCategoryToolsProps {
  pinId?: string
  location?: { latitude: number; longitude: number }
  className?: string
}

export default function BusinessCategoryTools({ 
  pinId, 
  location,
  className 
}: BusinessCategoryToolsProps) {
  const [activeTab, setActiveTab] = useState('directory')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([])
  const [projects, setProjects] = useState<EconomicDevelopmentProject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showAddBusiness, setShowAddBusiness] = useState(false)

  useEffect(() => {
    fetchBusinessData()
  }, [pinId, location])

  const fetchBusinessData = async () => {
    try {
      setLoading(true)
      
      const [businessesRes, indicatorsRes, projectsRes] = await Promise.all([
        fetch(`/api/business/directory${location ? `?lat=${location.latitude}&lng=${location.longitude}` : ''}`),
        fetch('/api/business/indicators'),
        fetch(`/api/business/development${pinId ? `?pin_id=${pinId}` : ''}`)
      ])

      if (businessesRes.ok) {
        const businessesData = await businessesRes.json()
        setBusinesses(businessesData)
      }

      if (indicatorsRes.ok) {
        const indicatorsData = await indicatorsRes.json()
        setIndicators(indicatorsData)
      }

      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }

    } catch (error) {
      console.error('Error fetching business data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'retail': return <ShoppingBag className="w-5 h-5" />
      case 'restaurant': return <Utensils className="w-5 h-5" />
      case 'cafe': return <Coffee className="w-5 h-5" />
      case 'automotive': return <Car className="w-5 h-5" />
      case 'construction': return <Hammer className="w-5 h-5" />
      case 'healthcare': return <Heart className="w-5 h-5" />
      case 'education': return <GraduationCap className="w-5 h-5" />
      case 'manufacturing': return <Factory className="w-5 h-5" />
      case 'professional': return <Briefcase className="w-5 h-5" />
      default: return <Store className="w-5 h-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white'
      case 'temporarily_closed': return 'bg-orange-500 text-white'
      case 'permanently_closed': return 'bg-red-500 text-white'
      case 'coming_soon': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />
      default: return <BarChart3 className="w-4 h-4 text-gray-600" />
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white'
      case 'active': return 'bg-blue-500 text-white'
      case 'planning': return 'bg-orange-500 text-white'
      case 'on_hold': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         business.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const businessCategories = [...new Set(businesses.map(b => b.category))]

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
                <Building2 className="w-5 h-5 text-silas-green" />
                <span>Business & Economic Development</span>
              </CardTitle>
              <CardDescription>
                Manage local business directory, track economic indicators, and coordinate development initiatives
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={fetchBusinessData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowAddBusiness(true)}
                className="bg-silas-green hover:bg-silas-green/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Business
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Business Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Businesses</p>
                <p className="text-2xl font-bold">
                  {businesses.filter(b => b.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employment</p>
                <p className="text-2xl font-bold">
                  {businesses.reduce((sum, b) => sum + b.employees, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold">
                  {(businesses.reduce((sum, b) => sum + b.rating, 0) / businesses.length || 0).toFixed(1)}
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
                <p className="text-sm font-medium text-gray-600">Development Projects</p>
                <p className="text-2xl font-bold">
                  {projects.filter(p => ['active', 'planning'].includes(p.status)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="indicators">Economic Data</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search businesses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {businessCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Business Listings */}
          <div className="grid gap-4">
            {filteredBusinesses.map(business => (
              <Card key={business.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-gray-600">
                        {getCategoryIcon(business.category)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-lg">{business.name}</h3>
                          <Badge className={getStatusColor(business.status)}>
                            {business.status.replace('_', ' ')}
                          </Badge>
                          {business.rating > 0 && (
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              <span className="text-sm font-medium">{business.rating}</span>
                              <span className="text-xs text-gray-500">({business.review_count})</span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{business.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Contact</label>
                            <div className="space-y-1">
                              {business.contact.phone && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <Phone className="w-3 h-3" />
                                  <span>{business.contact.phone}</span>
                                </div>
                              )}
                              {business.contact.email && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <Mail className="w-3 h-3" />
                                  <span>{business.contact.email}</span>
                                </div>
                              )}
                              {business.contact.website && (
                                <div className="flex items-center space-x-1 text-sm">
                                  <Globe className="w-3 h-3" />
                                  <a href={business.contact.website} target="_blank" rel="noopener noreferrer" 
                                     className="text-blue-600 hover:underline">
                                    Website
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-600">Business Info</label>
                            <div className="space-y-1 text-sm">
                              <div>Employees: {business.employees}</div>
                              <div>Founded: {business.founded_year}</div>
                              <div>Category: {business.category}</div>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-600">Community Impact</label>
                            <div className="space-y-1 text-sm">
                              <div>Local Jobs: {business.social_impact.local_jobs}</div>
                              <div>Sustainability: {business.social_impact.sustainability_practices.length} practices</div>
                              <div>Community: {business.social_impact.community_involvement.length} activities</div>
                            </div>
                          </div>
                        </div>

                        {business.services.length > 0 && (
                          <div className="mb-3">
                            <label className="text-sm font-medium text-gray-600">Services</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {business.services.slice(0, 5).map(service => (
                                <Badge key={service} variant="outline" className="text-xs">
                                  {service}
                                </Badge>
                              ))}
                              {business.services.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{business.services.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <Badge variant="outline" className="capitalize">
                        {business.category}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{business.contact.address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredBusinesses.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Businesses Found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Add the first business to get started'
                    }
                  </p>
                  {!searchQuery && selectedCategory === 'all' && (
                    <Button
                      onClick={() => setShowAddBusiness(true)}
                      className="bg-silas-green hover:bg-silas-green/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Business
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Economic Indicators</CardTitle>
              <CardDescription>
                Key economic metrics and trends for the local business environment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {indicators.map(indicator => (
                  <div key={indicator.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-gray-600">
                        {getTrendIcon(indicator.trend)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{indicator.name}</h4>
                        <p className="text-sm text-gray-600">
                          Updated {formatDistanceToNow(new Date(indicator.last_updated), { addSuffix: true })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold">
                          {indicator.value.toLocaleString()} {indicator.unit}
                        </span>
                        {getTrendIcon(indicator.trend)}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>1M: {indicator.change_1m > 0 ? '+' : ''}{indicator.change_1m.toFixed(1)}%</span>
                        <span>1Y: {indicator.change_1y > 0 ? '+' : ''}{indicator.change_1y.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}

                {indicators.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No economic indicators available</p>
                    <p className="text-sm">Economic data will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="development" className="space-y-4">
          <div className="grid gap-4">
            {projects.map(project => (
              <Card key={project.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{project.title}</h3>
                        <Badge className={getProjectStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{project.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Budget Progress</label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Progress value={(project.spent / project.budget) * 100} className="flex-1" />
                            <span className="text-sm font-medium">
                              {Math.round((project.spent / project.budget) * 100)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            £{project.spent.toLocaleString()} / £{project.budget.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Impact</label>
                          <div className="space-y-1">
                            <p className="text-sm">Jobs Created: {project.jobs_created}</p>
                            <p className="text-sm">Beneficiaries: {project.beneficiaries}</p>
                            <p className="text-sm">Economic Impact: £{project.economic_impact.toLocaleString()}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Timeline</label>
                          <div className="space-y-1">
                            <p className="text-sm">Start: {format(new Date(project.start_date), 'MMM yyyy')}</p>
                            <p className="text-sm">End: {format(new Date(project.end_date), 'MMM yyyy')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Project Milestones</h4>
                        {project.milestones.map(milestone => (
                          <div key={milestone.id} className="flex items-center space-x-2">
                            {milestone.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={cn(
                              "text-sm",
                              milestone.completed ? "text-green-700" : "text-gray-600"
                            )}>
                              {milestone.title}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(milestone.target_date), 'MMM d')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Partners: {project.partners.length}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {project.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {projects.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold mb-2">No Development Projects</h3>
                  <p className="text-gray-600">
                    Economic development projects will be displayed here
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Analytics</CardTitle>
              <CardDescription>
                Insights and trends from local business data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Business Distribution</h3>
                  <div className="space-y-2">
                    {businessCategories.map(category => {
                      const count = businesses.filter(b => b.category === category).length
                      const percentage = (count / businesses.length) * 100
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{category}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-silas-green h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Key Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Businesses:</span>
                      <span className="font-medium">{businesses.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Employees:</span>
                      <span className="font-medium">
                        {Math.round(businesses.reduce((sum, b) => sum + b.employees, 0) / businesses.length || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Rating:</span>
                      <span className="font-medium">
                        {(businesses.reduce((sum, b) => sum + b.rating, 0) / businesses.length || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">New This Year:</span>
                      <span className="font-medium">
                        {businesses.filter(b => new Date(b.created_at).getFullYear() === new Date().getFullYear()).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
