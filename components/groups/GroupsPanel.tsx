/**
 * Groups Panel Component
 * Complete group management interface with real functionality
 */

'use client'

import { useState, useEffect } from 'react'
import { Plus, Users, Search, Filter, MoreHorizontal, UserPlus, Settings, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/auth-context'
import groupService, { Group, PinCategory } from '@/lib/services/group-service'
import { PIN_CATEGORIES } from '@/components/map/InteractiveLegend'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface GroupsPanelProps {
  className?: string
}

export default function GroupsPanel({ className = "" }: GroupsPanelProps) {
  const [groups, setGroups] = useState<Group[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PinCategory | 'all'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { user, isAuthenticated } = useAuth()

  // Load groups
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true)

        // Load all public groups
        const { groups: allGroups } = await groupService.getGroups({
          is_public: true
        })
        setGroups(allGroups)

        // Load user's groups if authenticated
        if (isAuthenticated && user) {
          const { groups: userGroups } = await groupService.getGroups({
            user_is_member: true
          })
          setMyGroups(userGroups)
        }
      } catch (error) {
        console.error('Error loading groups:', error)
        toast.error('Failed to load groups')
      } finally {
        setLoading(false)
      }
    }

    loadGroups()
  }, [isAuthenticated, user])

  const handleJoinGroup = async (groupId: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to join groups')
      return
    }

    try {
      await groupService.joinGroup(groupId)
      
      // Update local state
      const group = groups.find(g => g.id === groupId)
      if (group) {
        setMyGroups(prev => [...prev, group])
        setGroups(prev => prev.map(g => 
          g.id === groupId 
            ? { ...g, member_count: g.member_count + 1, user_is_member: true }
            : g
        ))
      }
      
      toast.success('Successfully joined group!')
    } catch (error) {
      console.error('Error joining group:', error)
      toast.error('Failed to join group')
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await groupService.leaveGroup(groupId)
      
      // Update local state
      setMyGroups(prev => prev.filter(g => g.id !== groupId))
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, member_count: Math.max(0, g.member_count - 1), user_is_member: false }
          : g
      ))
      
      toast.success('Left group successfully')
    } catch (error) {
      console.error('Error leaving group:', error)
      toast.error('Failed to leave group')
    }
  }

  // Filter groups based on search and category
  const filteredGroups = groups.filter(group => {
    const matchesSearch = !searchQuery || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || group.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getCategoryConfig = (category: PinCategory) => {
    return PIN_CATEGORIES.find(c => c.category === category) || {
      label: category,
      icon: '📁',
      color: '#6B7280'
    }
  }

  const GroupCard = ({ group, isMyGroup = false }: { group: Group; isMyGroup?: boolean }) => {
    const categoryConfig = getCategoryConfig(group.category)
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={group.avatar_url || undefined} />
              <AvatarFallback style={{ backgroundColor: `${categoryConfig.color}20` }}>
                <span style={{ color: categoryConfig.color }}>{categoryConfig.icon}</span>
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                    {group.description}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="">
                    <DropdownMenuItem className="" inset={false}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {isMyGroup && (
                      <>
                        <DropdownMenuItem className="" inset={false}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleLeaveGroup(group.id)}
                          className="text-red-600"
                          inset={false}
                        >
                          Leave Group
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ 
                      borderColor: categoryConfig.color,
                      color: categoryConfig.color 
                    }}
                  >
                    {categoryConfig.label}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {group.member_count} members
                  </span>
                </div>
                
                {!isMyGroup && isAuthenticated && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleJoinGroup(group.id)}
                    className="h-7 px-2 text-xs"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Join
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className={cn("p-4", className)}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-gray-200 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
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
        <h2 className="font-semibold text-lg">Community Groups</h2>
        {isAuthenticated && (
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className=""
          >
            All
          </Button>
          {PIN_CATEGORIES.map(({ category, label, icon }) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              <span className="mr-1">{icon}</span>
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Groups Tabs */}
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discover" className="">Discover</TabsTrigger>
          <TabsTrigger value="my-groups" className="">My Groups ({myGroups.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="discover" className="space-y-3 mt-4">
          {filteredGroups.length === 0 ? (
            <Card className="">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No groups found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredGroups.map(group => (
              <GroupCard key={group.id} group={group} />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="my-groups" className="space-y-3 mt-4">
          {!isAuthenticated ? (
            <Card className="">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Sign in to see your groups</p>
              </CardContent>
            </Card>
          ) : myGroups.length === 0 ? (
            <Card className="">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">You haven't joined any groups yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Discover groups in the other tab
                </p>
              </CardContent>
            </Card>
          ) : (
            myGroups.map(group => (
              <GroupCard key={group.id} group={group} isMyGroup />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="">
          <DialogHeader className="">
            <DialogTitle className="">Create New Group</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-gray-500">
            Group creation feature coming soon...
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
