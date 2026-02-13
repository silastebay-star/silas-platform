/**
 * Panel Content Components
 * Content components for different panel types
 */

'use client'

import { useState } from 'react'
import { 
  Users, 
  DollarSign, 
  Calendar, 
  Building2, 
  Leaf, 
  Bot, 
  Settings,
  User,
  Bell,
  Search,
  MessageSquare,
  Plus,
  Filter,
  TrendingUp,
  Activity,
  Heart,
  MapPin,
  Clock,
  Star,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Community Panel Content
export function CommunityPanelContent() {
  const [activeTab, setActiveTab] = useState('feed')
  
  const communityPosts = [
    {
      id: 1,
      author: 'Sarah Johnson',
      time: '2 hours ago',
      content: 'Great turnout at the community garden cleanup today! Thanks to everyone who participated.',
      likes: 12,
      comments: 3,
      type: 'update'
    },
    {
      id: 2,
      author: 'Mike Chen',
      time: '4 hours ago',
      content: 'Proposal: New bike path along the canal. Would love to hear your thoughts!',
      likes: 8,
      comments: 7,
      type: 'proposal'
    },
    {
      id: 3,
      author: 'Emma Wilson',
      time: '1 day ago',
      content: 'Local business spotlight: The new bakery on High Street is amazing! Support local!',
      likes: 15,
      comments: 5,
      type: 'spotlight'
    }
  ]
  
  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger className="" value="feed">Feed</TabsTrigger>
            <TabsTrigger className="" value="members">Members</TabsTrigger>
            <TabsTrigger className="" value="groups">Groups</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="feed" className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            {/* New Post */}
            <Card className="">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea 
                      placeholder="Share something with the community..."
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        <Button className="" variant="outline" size="sm">
                          <MapPin className="h-4 w-4 mr-1" />
                          Location
                        </Button>
                        <Button className="" variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Event
                        </Button>
                      </div>
                      <Button className="" variant="default" size="sm">
                        <Send className="h-4 w-4 mr-1" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Posts */}
            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {communityPosts.map(post => (
                  <Card className="" key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar>
                          <AvatarFallback>{post.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">{post.author}</span>
                            <span className="text-sm text-gray-500">{post.time}</span>
                            <Badge variant="outline" className="text-xs">
                              {post.type}
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-3">{post.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-red-500">
                              <Heart className="h-4 w-4" />
                              {post.likes}
                            </button>
                            <button className="flex items-center gap-1 hover:text-blue-500">
                              <MessageSquare className="h-4 w-4" />
                              {post.comments}
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Community Members</h3>
              <Badge className="" variant="secondary">248 members</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card className="" key={i}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>M{i + 1}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">Member {i + 1}</p>
                        <p className="text-xs text-gray-500">Active contributor</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="groups" className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Interest Groups</h3>
            <div className="space-y-3">
              {[
                { name: 'Sustainability Circle', members: 45, icon: Leaf },
                { name: 'Local Business Network', members: 32, icon: Building2 },
                { name: 'Community Events', members: 67, icon: Calendar },
                { name: 'Neighborhood Watch', members: 28, icon: Users }
              ].map((group, i) => {
                const Icon = group.icon
                return (
                  <Card className="" key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-silas-green" />
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-gray-500">{group.members} members</p>
                          </div>
                        </div>
                        <Button className="" variant="outline" size="sm">Join</Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Fund Panel Content
export function FundPanelContent() {
  const [activeTab, setActiveTab] = useState('projects')
  
  const projects = [
    {
      id: 1,
      title: 'Community Garden Expansion',
      description: 'Expand the existing community garden with new plots and a greenhouse.',
      goal: 5000,
      raised: 3200,
      backers: 45,
      daysLeft: 12,
      category: 'Environment'
    },
    {
      id: 2,
      title: 'Youth Sports Equipment',
      description: 'New equipment for the local youth football and basketball teams.',
      goal: 2500,
      raised: 1800,
      backers: 28,
      daysLeft: 8,
      category: 'Sports'
    },
    {
      id: 3,
      title: 'Senior Center Renovation',
      description: 'Renovate the senior center with new furniture and accessibility improvements.',
      goal: 8000,
      raised: 6400,
      backers: 72,
      daysLeft: 5,
      category: 'Community'
    }
  ]
  
  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger className="" value="projects">Projects</TabsTrigger>
            <TabsTrigger className="" value="backed">Backed</TabsTrigger>
            <TabsTrigger className="" value="create">Create</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="projects" className="flex-1 px-4 pb-4">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {projects.map(project => {
                const progress = (project.raised / project.goal) * 100
                
                return (
                  <Card className="" key={project.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{project.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          </div>
                          <Badge className="" variant="outline">{project.category}</Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>£{project.raised.toLocaleString()} raised</span>
                            <span>£{project.goal.toLocaleString()} goal</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-silas-green h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{project.backers} backers</span>
                            <span>{project.daysLeft} days left</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button className="flex-1" variant="default" size="sm">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Back Project
                          </Button>
                          <Button className="" variant="outline" size="sm">
                            Learn More
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="backed" className="flex-1 px-4 pb-4">
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No Backed Projects</h3>
            <p className="text-gray-500 mb-4">You haven't backed any projects yet.</p>
            <Button className="" variant="default" size="default" onClick={() => setActiveTab('projects')}>
              Explore Projects
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="create" className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Create New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Project Title</label>
                <Input className="" type="text" placeholder="Enter project title..." />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea placeholder="Describe your project..." className="min-h-[100px]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Funding Goal</label>
                  <Input className="" type="number" placeholder="£0" />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (days)</label>
                  <Input className="" type="number" placeholder="30" />
                </div>
              </div>
              <Button className="w-full" variant="default" size="default">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Chat Panel Content
export function ChatPanelContent() {
  const [message, setMessage] = useState('')
  
  const messages = [
    { id: 1, author: 'Sarah', content: 'Has anyone seen the new community notice board?', time: '10:30 AM' },
    { id: 2, author: 'Mike', content: 'Yes! It looks great. Thanks to everyone who helped set it up.', time: '10:32 AM' },
    { id: 3, author: 'Emma', content: 'When is the next community meeting?', time: '10:35 AM' },
    { id: 4, author: 'You', content: 'I think it\'s next Thursday at 7 PM in the community center.', time: '10:36 AM' }
  ]
  
  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Community Chat</h3>
            <p className="text-sm text-gray-500">24 members online</p>
          </div>
          <div className="flex gap-2">
            <Button className="" variant="outline" size="sm">
              <Users className="h-4 w-4" />
            </Button>
            <Button className="" variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.author === 'You' ? 'justify-end' : ''}`}>
              {msg.author !== 'You' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{msg.author[0]}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[70%] ${msg.author === 'You' ? 'order-first' : ''}`}>
                <div className={`p-3 rounded-lg ${
                  msg.author === 'You' 
                    ? 'bg-silas-green text-white' 
                    : 'bg-gray-100'
                }`}>
                  {msg.author !== 'You' && (
                    <p className="text-xs font-medium mb-1">{msg.author}</p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-1">{msg.time}</p>
              </div>
              {msg.author === 'You' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            className=""
            type="text"
            value={message}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter' && message.trim()) {
                // Handle send message
                setMessage('')
              }
            }}
          />
          <Button className="" variant="default" size="sm" disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Settings Panel Content
export function SettingsPanelContent() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-gray-500">Receive community updates</p>
            </div>
            <Button className="" variant="outline" size="sm">Configure</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Privacy</p>
              <p className="text-sm text-gray-500">Control your visibility</p>
            </div>
            <Button className="" variant="outline" size="sm">Manage</Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Map Settings</p>
              <p className="text-sm text-gray-500">Customize map appearance</p>
            </div>
            <Button className="" variant="outline" size="sm">Edit</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Search Panel Content
export function SearchPanelContent() {
  const [query, setQuery] = useState('')
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <Input
            type="text"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search community content..."
            className="flex-1"
          />
          <Button className="" variant="default" size="default">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        {query ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Search results for "{query}"</p>
            {/* Search results would go here */}
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Search Community</h3>
            <p className="text-gray-500">Find posts, projects, events, and more</p>
          </div>
        )}
      </div>
    </div>
  )
}
