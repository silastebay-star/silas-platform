/**
 * Community Feed Component
 * Main social feed with activity aggregation, filtering, and real-time updates
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Filter,
  Search,
  Plus,
  MapPin,
  Calendar,
  Users,
  Vote,
  Zap,
  TrendingUp,
  Image as ImageIcon,
  Send,
  Bookmark,
  Flag,
  Eye
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface FeedItem {
  id: string
  type: 'pin_created' | 'pin_updated' | 'proposal_created' | 'proposal_voted' | 'project_milestone' | 'group_activity' | 'user_post'
  author: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
    role?: string
  }
  content: {
    title?: string
    description?: string
    text?: string
    images?: string[]
    location?: {
      latitude: number
      longitude: number
      address?: string
    }
    metadata?: any
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    views: number
    user_liked: boolean
    user_bookmarked: boolean
  }
  related_items?: {
    pin_id?: string
    proposal_id?: string
    project_id?: string
    group_id?: string
  }
  created_at: string
  updated_at: string
}

interface CommunityFeedProps {
  className?: string
}

export default function CommunityFeed({ className }: CommunityFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pins' | 'proposals' | 'projects' | 'groups'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImages, setNewPostImages] = useState<File[]>([])
  const observerRef = useRef<IntersectionObserver>()
  const lastItemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchFeedItems(true)
  }, [filter, searchQuery])

  useEffect(() => {
    // Set up intersection observer for infinite scroll
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchFeedItems(false)
        }
      },
      { threshold: 1.0 }
    )

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current)
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [feedItems, hasMore, loading])

  const fetchFeedItems = async (reset = false) => {
    try {
      setLoading(true)
      
      const offset = reset ? 0 : feedItems.length
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
        filter,
        search: searchQuery
      })

      const response = await fetch(`/api/feed?${params}`)
      if (!response.ok) throw new Error('Failed to fetch feed')

      const data = await response.json()
      
      if (reset) {
        setFeedItems(data.items)
      } else {
        setFeedItems(prev => [...prev, ...data.items])
      }
      
      setHasMore(data.has_more)
      
    } catch (error) {
      console.error('Error fetching feed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (itemId: string) => {
    try {
      const response = await fetch(`/api/feed/${itemId}/like`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setFeedItems(prev => prev.map(item => 
          item.id === itemId 
            ? {
                ...item,
                engagement: {
                  ...item.engagement,
                  likes: item.engagement.user_liked 
                    ? item.engagement.likes - 1 
                    : item.engagement.likes + 1,
                  user_liked: !item.engagement.user_liked
                }
              }
            : item
        ))
      }
    } catch (error) {
      console.error('Error liking item:', error)
    }
  }

  const handleBookmark = async (itemId: string) => {
    try {
      const response = await fetch(`/api/feed/${itemId}/bookmark`, {
        method: 'POST'
      })
      
      if (response.ok) {
        setFeedItems(prev => prev.map(item => 
          item.id === itemId 
            ? {
                ...item,
                engagement: {
                  ...item.engagement,
                  user_bookmarked: !item.engagement.user_bookmarked
                }
              }
            : item
        ))
      }
    } catch (error) {
      console.error('Error bookmarking item:', error)
    }
  }

  const createPost = async () => {
    if (!newPostContent.trim()) return

    try {
      const formData = new FormData()
      formData.append('content', newPostContent)
      formData.append('type', 'user_post')
      
      newPostImages.forEach((image, index) => {
        formData.append(`image_${index}`, image)
      })

      const response = await fetch('/api/feed', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const newItem = await response.json()
        setFeedItems(prev => [newItem, ...prev])
        setNewPostContent('')
        setNewPostImages([])
        setShowCreatePost(false)
      }
    } catch (error) {
      console.error('Error creating post:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'pin_created':
      case 'pin_updated':
        return <MapPin className="w-5 h-5 text-blue-600" />
      case 'proposal_created':
      case 'proposal_voted':
        return <Vote className="w-5 h-5 text-purple-600" />
      case 'project_milestone':
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'group_activity':
        return <Users className="w-5 h-5 text-orange-600" />
      default:
        return <Zap className="w-5 h-5 text-gray-600" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'pin_created':
      case 'pin_updated':
        return 'border-l-blue-500'
      case 'proposal_created':
      case 'proposal_voted':
        return 'border-l-purple-500'
      case 'project_milestone':
        return 'border-l-green-500'
      case 'group_activity':
        return 'border-l-orange-500'
      default:
        return 'border-l-gray-500'
    }
  }

  const formatActivityTitle = (item: FeedItem) => {
    switch (item.type) {
      case 'pin_created':
        return `${item.author.full_name} created a new pin`
      case 'pin_updated':
        return `${item.author.full_name} updated a pin`
      case 'proposal_created':
        return `${item.author.full_name} created a proposal`
      case 'proposal_voted':
        return `${item.author.full_name} voted on a proposal`
      case 'project_milestone':
        return `${item.author.full_name} completed a milestone`
      case 'group_activity':
        return `${item.author.full_name} posted in a group`
      case 'user_post':
        return `${item.author.full_name} shared an update`
      default:
        return `${item.author.full_name} posted an update`
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Feed Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-silas-green" />
                <span>Community Feed</span>
              </CardTitle>
              <CardDescription>
                Stay connected with your community's latest activities
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-silas-green hover:bg-silas-green/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share Update
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search community activity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="pins">Pins</SelectItem>
                  <SelectItem value="proposals">Proposals</SelectItem>
                  <SelectItem value="projects">Projects</SelectItem>
                  <SelectItem value="groups">Groups</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Post Modal */}
      {showCreatePost && (
        <Card>
          <CardHeader>
            <CardTitle>Share an Update</CardTitle>
            <CardDescription>
              Share what's happening in your community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={4}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Add Photos
                </Button>
                <Button variant="outline" size="sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createPost}
                  disabled={!newPostContent.trim()}
                  className="bg-silas-green hover:bg-silas-green/90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed Items */}
      <div className="space-y-4">
        {feedItems.map((item, index) => (
          <Card 
            key={item.id} 
            className={cn("border-l-4", getActivityColor(item.type))}
            ref={index === feedItems.length - 1 ? lastItemRef : null}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {/* Author Avatar */}
                <Avatar className="w-12 h-12">
                  <AvatarImage src={item.author.avatar_url} />
                  <AvatarFallback>
                    {item.author.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getActivityIcon(item.type)}
                      <div>
                        <h3 className="font-semibold text-sm">
                          {formatActivityTitle(item)}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>@{item.author.username}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                          {item.author.role && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {item.author.role}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    {item.content.title && (
                      <h4 className="font-semibold">{item.content.title}</h4>
                    )}
                    
                    {(item.content.description || item.content.text) && (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {item.content.description || item.content.text}
                      </p>
                    )}

                    {item.content.images && item.content.images.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                        {item.content.images.slice(0, 4).map((image, idx) => (
                          <img
                            key={idx}
                            src={image}
                            alt=""
                            className="w-full h-32 object-cover"
                          />
                        ))}
                      </div>
                    )}

                    {item.content.location && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <MapPin className="w-4 h-4" />
                        <span>{item.content.location.address || 'Location shared'}</span>
                      </div>
                    )}
                  </div>

                  {/* Engagement */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(item.id)}
                        className={cn(
                          "flex items-center space-x-1 text-sm transition-colors",
                          item.engagement.user_liked 
                            ? "text-red-600" 
                            : "text-gray-600 hover:text-red-600"
                        )}
                      >
                        <Heart className={cn(
                          "w-4 h-4",
                          item.engagement.user_liked && "fill-current"
                        )} />
                        <span>{item.engagement.likes}</span>
                      </button>

                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span>{item.engagement.comments}</span>
                      </button>

                      <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-green-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>{item.engagement.shares}</span>
                      </button>

                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Eye className="w-4 h-4" />
                        <span>{item.engagement.views}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleBookmark(item.id)}
                        className={cn(
                          "p-1 rounded transition-colors",
                          item.engagement.user_bookmarked 
                            ? "text-yellow-600" 
                            : "text-gray-400 hover:text-yellow-600"
                        )}
                      >
                        <Bookmark className={cn(
                          "w-4 h-4",
                          item.engagement.user_bookmarked && "fill-current"
                        )} />
                      </button>

                      <button className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors">
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green" />
          </div>
        )}

        {/* End of feed */}
        {!hasMore && feedItems.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>You've reached the end of the feed</p>
            <p className="text-sm">Check back later for new updates!</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && feedItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first to share something with your community!
              </p>
              <Button
                onClick={() => setShowCreatePost(true)}
                className="bg-silas-green hover:bg-silas-green/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
