/**
 * Community Fund Component
 * Complete community funding platform with project proposals and donations
 */

'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { DollarSign, Target, Users, Calendar, TrendingUp, Plus, Heart, Share2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/lib/auth/auth-context'
import { PIN_CATEGORIES } from '@/components/map/InteractiveLegend'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FundingProject {
  id: string
  title: string
  description: string
  category: string
  goal_amount: number
  raised_amount: number
  supporter_count: number
  deadline: string
  status: 'active' | 'funded' | 'expired'
  creator: {
    id: string
    name: string
    avatar_url?: string
  }
  created_at: string
  images: string[]
}

interface CommunityFundProps {
  className?: string
}

export default function CommunityFund({ className = "" }: CommunityFundProps) {
  const [projects, setProjects] = useState<FundingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<FundingProject | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDonateDialog, setShowDonateDialog] = useState(false)
  const [donationAmount, setDonationAmount] = useState('')

  const { user, isAuthenticated } = useAuth()

  // Load funding projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setLoading(true)

        // Mock data for now - will be replaced with real API calls
        const mockProjects: FundingProject[] = [
          {
            id: '1',
            title: 'Community Garden Expansion',
            description: 'Expand our community garden with new raised beds, tools, and a greenhouse for year-round growing.',
            category: 'projects',
            goal_amount: 5000,
            raised_amount: 3250,
            supporter_count: 42,
            deadline: '2024-03-15',
            status: 'active',
            creator: {
              id: 'user1',
              name: 'Sarah Johnson',
              avatar_url: undefined
            },
            created_at: '2024-01-15T10:00:00Z',
            images: []
          },
          {
            id: '2',
            title: 'Youth Sports Equipment',
            description: 'Purchase new sports equipment for our local youth programs including footballs, basketballs, and safety gear.',
            category: 'community',
            goal_amount: 2500,
            raised_amount: 2500,
            supporter_count: 28,
            deadline: '2024-02-28',
            status: 'funded',
            creator: {
              id: 'user2',
              name: 'Mike Thompson',
              avatar_url: undefined
            },
            created_at: '2024-01-10T14:30:00Z',
            images: []
          },
          {
            id: '3',
            title: 'Street Light Repairs',
            description: 'Fund repairs for broken street lights on Oak Avenue to improve safety for evening walkers.',
            category: 'issues',
            goal_amount: 1800,
            raised_amount: 950,
            supporter_count: 15,
            deadline: '2024-02-20',
            status: 'active',
            creator: {
              id: 'user3',
              name: 'Lisa Chen',
              avatar_url: undefined
            },
            created_at: '2024-01-20T09:15:00Z',
            images: []
          }
        ]

        setProjects(mockProjects)
      } catch (error) {
        console.error('Error loading projects:', error)
        toast.error('Failed to load funding projects')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const handleDonate = async (projectId: string, amount: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to donate')
      return
    }

    try {
      // Mock donation process - will be replaced with real payment processing
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update project locally
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { 
              ...project, 
              raised_amount: project.raised_amount + amount,
              supporter_count: project.supporter_count + 1
            }
          : project
      ))

      setShowDonateDialog(false)
      setDonationAmount('')
      toast.success(`Successfully donated £${amount}!`)
    } catch (error) {
      console.error('Error processing donation:', error)
      toast.error('Failed to process donation')
    }
  }

  const getCategoryConfig = (category: string) => {
    return PIN_CATEGORIES.find(c => c.category === category) || {
      label: category,
      icon: '📁',
      color: '#6B7280'
    }
  }

  const ProjectCard = ({ project }: { project: FundingProject }) => {
    const categoryConfig = getCategoryConfig(project.category)
    const progressPercentage = (project.raised_amount / project.goal_amount) * 100
    const daysLeft = Math.max(0, Math.ceil((new Date(project.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2">{project.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                  {project.description}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="">
                  <DropdownMenuItem className="" inset={false} onClick={() => setSelectedProject(project)}>
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="" inset={false}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">£{project.raised_amount.toLocaleString()}</span>
                <span className="text-gray-600">of £{project.goal_amount.toLocaleString()}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{progressPercentage.toFixed(0)}% funded</span>
                <span>{project.supporter_count} supporters</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: categoryConfig.color,
                    color: categoryConfig.color 
                  }}
                >
                  {categoryConfig.icon} {categoryConfig.label}
                </Badge>
                
                {project.status === 'funded' ? (
                  <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                    Funded
                  </Badge>
                ) : daysLeft === 0 ? (
                  <Badge variant="destructive" className="text-xs">
                    Expired
                  </Badge>
                ) : (
                  <span className="text-xs text-gray-500">
                    {daysLeft} days left
                  </span>
                )}
              </div>
              
              {project.status === 'active' && isAuthenticated && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    setSelectedProject(project)
                    setShowDonateDialog(true)
                  }}
                  className="h-7 px-3 text-xs"
                >
                  <Heart className="h-3 w-3 mr-1" />
                  Donate
                </Button>
              )}
            </div>

            {/* Creator */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <Avatar className="h-6 w-6">
                <AvatarImage src={project.creator.avatar_url} />
                <AvatarFallback className="text-xs">
                  {project.creator.name[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600">
                by {project.creator.name}
              </span>
              <span className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeProjects = projects.filter(p => p.status === 'active')
  const fundedProjects = projects.filter(p => p.status === 'funded')
  const totalRaised = projects.reduce((sum, p) => sum + p.raised_amount, 0)
  const totalSupporters = projects.reduce((sum, p) => sum + p.supporter_count, 0)

  if (loading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("p-4 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Community Fund</h2>
        {isAuthenticated && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Propose
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-silas-green">
              £{totalRaised.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Total Raised</div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-blue-600">
              {projects.length}
            </div>
            <div className="text-xs text-gray-600">Projects</div>
          </CardContent>
        </Card>

        <Card className="">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold text-purple-600">
              {totalSupporters}
            </div>
            <div className="text-xs text-gray-600">Supporters</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="">Active ({activeProjects.length})</TabsTrigger>
          <TabsTrigger value="funded" className="">Funded ({fundedProjects.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-3 mt-4">
          {activeProjects.length === 0 ? (
            <Card className="">
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No active projects</p>
                <p className="text-sm text-gray-500 mt-1">
                  Be the first to propose a community project
                </p>
              </CardContent>
            </Card>
          ) : (
            activeProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="funded" className="space-y-3 mt-4">
          {fundedProjects.length === 0 ? (
            <Card className="">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No funded projects yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Funded projects will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            fundedProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="">
          <DialogHeader className="">
            <DialogTitle className="">Propose New Project</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            Project proposal feature coming soon...
          </div>
        </DialogContent>
      </Dialog>

      {/* Donate Dialog */}
      <Dialog open={showDonateDialog} onOpenChange={setShowDonateDialog}>
        <DialogContent className="">
          <DialogHeader className="">
            <DialogTitle className="">Support Project</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedProject.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  £{selectedProject.raised_amount.toLocaleString()} of £{selectedProject.goal_amount.toLocaleString()} raised
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Donation Amount (£)</Label>
                <Input
                  id="amount"
                  type="number"
                  className=""
                  placeholder="Enter amount"
                  value={donationAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDonationAmount(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setShowDonateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="default"
                  onClick={() => {
                    const amount = parseFloat(donationAmount)
                    if (amount > 0) {
                      handleDonate(selectedProject.id, amount)
                    }
                  }}
                  disabled={!donationAmount || parseFloat(donationAmount) <= 0}
                  className="flex-1"
                >
                  Donate £{donationAmount || '0'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
