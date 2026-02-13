/**
 * Social Engagement Features Component
 * User following, content sharing, and social discovery
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserPlus, 
  UserMinus, 
  Share2, 
  Search, 
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Bookmark,
  Eye,
  Star,
  MapPin,
  Calendar,
  Award,
  Activity,
  Filter,
  ExternalLink,
  Copy,
  Mail,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface User {
  id: string
  full_name: string
  username: string
  avatar_url?: string
  role?: string
  bio?: string
  location?: string
  joined_at: string
  follower_count: number
  following_count: number
  post_count: number
  reputation: number
  is_following: boolean
  is_followed_by: boolean
  badges: string[]
  interests: string[]
}

interface TrendingContent {
  id: string
  type: 'pin' | 'proposal' | 'project' | 'post'
  title: string
  description?: string
  author: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    views: number
  }
  created_at: string
  trending_score: number
}

interface SocialEngagementProps {
  currentUserId?: string
  className?: string
}

export default function SocialEngagementFeatures({ currentUserId, className }: SocialEngagementProps) {
  const [activeTab, setActiveTab] = useState('discover')
  const [users, setUsers] = useState<User[]>([])
  const [trendingContent, setTrendingContent] = useState<TrendingContent[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [followers, setFollowers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareContent, setShareContent] = useState<TrendingContent | null>(null)

  useEffect(() => {
    fetchSocialData()
  }, [activeTab, searchQuery])

  const fetchSocialData = async () => {
    try {
      setLoading(true)
      
      switch (activeTab) {
        case 'discover':
          await Promise.all([
            fetchSuggestedUsers(),
            fetchTrendingContent()
          ])
          break
        case 'following':
          await fetchFollowing()
          break
        case 'followers':
          await fetchFollowers()
          break
      }
    } catch (error) {
      console.error('Error fetching social data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSuggestedUsers = async () => {
    try {
      const params = new URLSearchParams({
        type: 'suggested',
        search: searchQuery,
        limit: '20'
      })
      
      const response = await fetch(`/api/social/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error)
    }
  }

  const fetchTrendingContent = async () => {
    try {
      const response = await fetch('/api/social/trending')
      if (response.ok) {
        const data = await response.json()
        setTrendingContent(data)
      }
    } catch (error) {
      console.error('Error fetching trending content:', error)
    }
  }

  const fetchFollowing = async () => {
    try {
      const response = await fetch('/api/social/following')
      if (response.ok) {
        const data = await response.json()
        setFollowing(data)
      }
    } catch (error) {
      console.error('Error fetching following:', error)
    }
  }

  const fetchFollowers = async () => {
    try {
      const response = await fetch('/api/social/followers')
      if (response.ok) {
        const data = await response.json()
        setFollowers(data)
      }
    } catch (error) {
      console.error('Error fetching followers:', error)
    }
  }

  const followUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/social/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_following: true, 
                follower_count: user.follower_count + 1 
              }
            : user
        ))
      }
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const unfollowUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/social/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      })

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_following: false, 
                follower_count: Math.max(0, user.follower_count - 1) 
              }
            : user
        ))
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  const shareContent = async (content: TrendingContent, platform?: string) => {
    const url = `${window.location.origin}/${content.type}s/${content.id}`
    const text = `Check out this ${content.type}: ${content.title}`

    if (platform) {
      let shareUrl = ''
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
          break
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
          break
        case 'linkedin':
          shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
          break
        case 'email':
          shareUrl = `mailto:?subject=${encodeURIComponent(content.title)}&body=${encodeURIComponent(text + '\n\n' + url)}`
          break
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400')
      }
    } else {
      // Copy to clipboard
      await navigator.clipboard.writeText(url)
    }

    // Track share
    await fetch('/api/social/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content_type: content.type,
        content_id: content.id,
        platform: platform || 'clipboard'
      })
    }).catch(err => console.error('Failed to track share:', err))

    setShareModalOpen(false)
  }

  const getUserBadgeColor = (badge: string) => {
    switch (badge) {
      case 'verified': return 'bg-blue-500 text-white'
      case 'contributor': return 'bg-green-500 text-white'
      case 'moderator': return 'bg-purple-500 text-white'
      case 'expert': return 'bg-orange-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'pin': return <MapPin className="w-4 h-4" />
      case 'proposal': return <Award className="w-4 h-4" />
      case 'project': return <Activity className="w-4 h-4" />
      default: return <MessageCircle className="w-4 h-4" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-silas-green" />
            <span>Social Discovery</span>
          </CardTitle>
          <CardDescription>
            Connect with community members and discover trending content
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search users, content, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Suggested Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested Users</CardTitle>
                <CardDescription>People you might want to follow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.slice(0, 5).map(user => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold truncate">{user.full_name}</h4>
                        {user.badges.map(badge => (
                          <Badge key={badge} className={cn("text-xs", getUserBadgeColor(badge))}>
                            {badge}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span>{user.follower_count} followers</span>
                        <span>{user.post_count} posts</span>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>{user.reputation}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={user.is_following ? "outline" : "default"}
                      onClick={() => user.is_following ? unfollowUser(user.id) : followUser(user.id)}
                      className={!user.is_following ? "bg-silas-green hover:bg-silas-green/90" : ""}
                    >
                      {user.is_following ? (
                        <>
                          <UserMinus className="w-3 h-3 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Insights</CardTitle>
                <CardDescription>What's happening in your community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1,247</div>
                    <div className="text-sm text-blue-700">Active Members</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">89</div>
                    <div className="text-sm text-green-700">New This Week</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">456</div>
                    <div className="text-sm text-purple-700">Posts Today</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">23</div>
                    <div className="text-sm text-orange-700">Active Projects</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Trending Content</span>
              </CardTitle>
              <CardDescription>
                Popular content in your community right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingContent.map(content => (
                  <div key={content.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="p-2 bg-gray-100 rounded">
                      {getContentTypeIcon(content.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold hover:text-silas-green cursor-pointer">
                            {content.title}
                          </h3>
                          {content.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {content.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>by {content.author.full_name}</span>
                            <span>{formatDistanceToNow(new Date(content.created_at), { addSuffix: true })}</span>
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-3 h-3" />
                                <span>{content.engagement.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{content.engagement.comments}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{content.engagement.views}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Badge variant="outline" className="text-xs">
                            {content.type}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShareContent(content)
                              setShareModalOpen(true)
                            }}
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="following" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Following ({following.length})</CardTitle>
              <CardDescription>People you're following</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {following.map(user => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{user.full_name}</h4>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <div className="text-xs text-gray-500">
                        {user.follower_count} followers
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unfollowUser(user.id)}
                    >
                      <UserMinus className="w-3 h-3 mr-1" />
                      Unfollow
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Followers ({followers.length})</CardTitle>
              <CardDescription>People following you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followers.map(user => (
                  <div key={user.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{user.full_name}</h4>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <div className="text-xs text-gray-500">
                        {user.follower_count} followers
                      </div>
                    </div>

                    {!user.is_following && (
                      <Button
                        size="sm"
                        onClick={() => followUser(user.id)}
                        className="bg-silas-green hover:bg-silas-green/90"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Follow Back
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Modal */}
      {shareModalOpen && shareContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Share Content</CardTitle>
              <CardDescription>
                Share "{shareContent.title}" with others
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => shareContent(shareContent, 'twitter')}
                  className="flex items-center space-x-2"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareContent(shareContent, 'facebook')}
                  className="flex items-center space-x-2"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareContent(shareContent, 'linkedin')}
                  className="flex items-center space-x-2"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareContent(shareContent, 'email')}
                  className="flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </Button>
              </div>
              
              <Button
                onClick={() => shareContent(shareContent)}
                className="w-full bg-silas-green hover:bg-silas-green/90"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>

              <Button
                variant="outline"
                onClick={() => setShareModalOpen(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
