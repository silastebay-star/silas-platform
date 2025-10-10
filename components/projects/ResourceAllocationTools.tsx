/**
 * Resource Allocation Tools Component
 * Comprehensive resource planning interface with budget tracking and allocation visualization
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  Users, 
  Clock, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Plus, 
  Edit, 
  Trash2,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
  Calendar,
  Target,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Resource {
  id: string
  name: string
  type: 'human' | 'financial' | 'material' | 'equipment' | 'service'
  category: string
  total_available: number
  allocated: number
  unit: string // e.g., 'hours', 'GBP', 'units', 'days'
  cost_per_unit: number
  supplier?: string
  availability_start?: string
  availability_end?: string
  skills_required?: string[]
  notes?: string
}

interface Allocation {
  id: string
  resource_id: string
  milestone_id?: string
  task_id?: string
  allocated_amount: number
  allocated_by: string
  allocation_date: string
  start_date: string
  end_date: string
  status: 'planned' | 'active' | 'completed' | 'cancelled'
  actual_used?: number
  notes?: string
}

interface Budget {
  id: string
  category: string
  total_budget: number
  allocated: number
  spent: number
  remaining: number
  variance: number // positive = under budget, negative = over budget
}

interface ResourceAllocationProps {
  projectId: string
  className?: string
}

export default function ResourceAllocationTools({ projectId, className }: ResourceAllocationProps) {
  const [resources, setResources] = useState<Resource[]>([])
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddResource, setShowAddResource] = useState(false)

  useEffect(() => {
    fetchResourceData()
  }, [projectId])

  const fetchResourceData = async () => {
    try {
      setLoading(true)
      
      const [resourcesRes, allocationsRes, budgetsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/resources`),
        fetch(`/api/projects/${projectId}/allocations`),
        fetch(`/api/projects/${projectId}/budgets`)
      ])

      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json()
        setResources(resourcesData)
      }

      if (allocationsRes.ok) {
        const allocationsData = await allocationsRes.json()
        setAllocations(allocationsData)
      }

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json()
        setBudgets(budgetsData)
      }

    } catch (error) {
      console.error('Error fetching resource data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate resource utilization
  const getResourceUtilization = (resource: Resource) => {
    const utilizationPercentage = resource.total_available > 0 
      ? (resource.allocated / resource.total_available) * 100 
      : 0
    return Math.min(utilizationPercentage, 100)
  }

  // Calculate total project costs
  const getTotalProjectCost = () => {
    return resources.reduce((total, resource) => {
      return total + (resource.allocated * resource.cost_per_unit)
    }, 0)
  }

  // Get resource status color
  const getResourceStatusColor = (utilization: number) => {
    if (utilization >= 100) return 'text-red-600'
    if (utilization >= 80) return 'text-orange-600'
    if (utilization >= 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Get budget status
  const getBudgetStatus = (budget: Budget) => {
    const utilizationPercentage = budget.total_budget > 0 
      ? (budget.spent / budget.total_budget) * 100 
      : 0
    
    if (utilizationPercentage >= 100) return { status: 'over', color: 'text-red-600' }
    if (utilizationPercentage >= 90) return { status: 'warning', color: 'text-orange-600' }
    if (utilizationPercentage >= 75) return { status: 'caution', color: 'text-yellow-600' }
    return { status: 'good', color: 'text-green-600' }
  }

  const totalBudget = budgets.reduce((sum, b) => sum + b.total_budget, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0)
  const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Resource Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Budget</p>
                <p className="text-2xl font-bold">£{totalBudget.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Allocated</p>
                <p className="text-2xl font-bold">£{totalAllocated.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Spent</p>
                <p className="text-2xl font-bold">£{totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold">£{(totalBudget - totalSpent).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-silas-green" />
            <span>Budget Utilization</span>
          </CardTitle>
          <CardDescription>
            Overall budget usage across all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Budget Used</span>
              <span className={budgetUtilization >= 90 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {budgetUtilization.toFixed(1)}% (£{totalSpent.toLocaleString()} / £{totalBudget.toLocaleString()})
              </span>
            </div>
            <Progress 
              value={budgetUtilization} 
              className={cn(
                "h-3",
                budgetUtilization >= 100 ? "bg-red-100" : 
                budgetUtilization >= 90 ? "bg-orange-100" : "bg-green-100"
              )}
            />
            
            {budgetUtilization >= 90 && (
              <Alert className={budgetUtilization >= 100 ? "border-red-200 bg-red-50" : "border-orange-200 bg-orange-50"}>
                <AlertTriangle className={cn("h-4 w-4", budgetUtilization >= 100 ? "text-red-600" : "text-orange-600")} />
                <AlertDescription className={budgetUtilization >= 100 ? "text-red-800" : "text-orange-800"}>
                  {budgetUtilization >= 100 
                    ? "Budget exceeded! Immediate attention required."
                    : "Budget utilization is high. Monitor spending carefully."
                  }
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resource Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Types Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Distribution</CardTitle>
                <CardDescription>Breakdown by resource type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['human', 'financial', 'material', 'equipment', 'service'].map(type => {
                    const typeResources = resources.filter(r => r.type === type)
                    const typeCount = typeResources.length
                    const typeCost = typeResources.reduce((sum, r) => sum + (r.allocated * r.cost_per_unit), 0)
                    
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            type === 'human' ? 'bg-blue-500' :
                            type === 'financial' ? 'bg-green-500' :
                            type === 'material' ? 'bg-orange-500' :
                            type === 'equipment' ? 'bg-purple-500' : 'bg-gray-500'
                          )} />
                          <span className="capitalize font-medium">{type}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">£{typeCost.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">{typeCount} resources</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Critical Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Critical Resources</CardTitle>
                <CardDescription>Resources with high utilization or constraints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resources
                    .filter(r => getResourceUtilization(r) >= 80)
                    .slice(0, 5)
                    .map(resource => {
                      const utilization = getResourceUtilization(resource)
                      return (
                        <div key={resource.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <div className="text-sm text-gray-600">{resource.category}</div>
                          </div>
                          <div className="text-right">
                            <div className={cn("font-medium", getResourceStatusColor(utilization))}>
                              {utilization.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-500">
                              {resource.allocated} / {resource.total_available} {resource.unit}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  
                  {resources.filter(r => getResourceUtilization(r) >= 80).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p>All resources are within normal utilization levels</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Resource Inventory</h3>
            <Button
              onClick={() => setShowAddResource(true)}
              className="bg-silas-green hover:bg-silas-green/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Resource
            </Button>
          </div>

          <div className="grid gap-4">
            {resources.map(resource => {
              const utilization = getResourceUtilization(resource)
              const totalCost = resource.allocated * resource.cost_per_unit
              
              return (
                <Card key={resource.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold">{resource.name}</h4>
                          <Badge variant="outline" className="capitalize">
                            {resource.type}
                          </Badge>
                          <Badge variant="secondary">
                            {resource.category}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Available:</span>
                            <div className="font-medium">{resource.total_available} {resource.unit}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Allocated:</span>
                            <div className="font-medium">{resource.allocated} {resource.unit}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Cost per unit:</span>
                            <div className="font-medium">£{resource.cost_per_unit}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Total cost:</span>
                            <div className="font-medium">£{totalCost.toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Utilization</span>
                            <span className={getResourceStatusColor(utilization)}>
                              {utilization.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={utilization} className="h-2" />
                        </div>

                        {resource.notes && (
                          <p className="text-sm text-gray-600 mt-2">{resource.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocations</CardTitle>
              <CardDescription>
                Current and planned resource assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Resource allocation timeline coming soon</p>
                <p className="text-sm">This will show detailed allocation schedules and conflicts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <div className="grid gap-4">
            {budgets.map(budget => {
              const status = getBudgetStatus(budget)
              const utilizationPercentage = budget.total_budget > 0 
                ? (budget.spent / budget.total_budget) * 100 
                : 0
              
              return (
                <Card key={budget.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-semibold capitalize">{budget.category}</h4>
                        <p className="text-sm text-gray-600">
                          £{budget.spent.toLocaleString()} spent of £{budget.total_budget.toLocaleString()}
                        </p>
                      </div>
                      <Badge className={cn(
                        status.status === 'over' ? 'bg-red-500' :
                        status.status === 'warning' ? 'bg-orange-500' :
                        status.status === 'caution' ? 'bg-yellow-500' : 'bg-green-500'
                      )}>
                        {utilizationPercentage.toFixed(1)}%
                      </Badge>
                    </div>

                    <Progress value={utilizationPercentage} className="h-3 mb-3" />

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Allocated:</span>
                        <div className="font-medium">£{budget.allocated.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Remaining:</span>
                        <div className="font-medium">£{budget.remaining.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Variance:</span>
                        <div className={cn(
                          "font-medium",
                          budget.variance >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {budget.variance >= 0 ? '+' : ''}£{budget.variance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
