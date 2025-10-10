/**
 * Discussion Forums Component
 * Category-specific forums with topics, threads, and moderation
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  Users, 
  Pin, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  Clock,
  Eye,
  MessageCircle,
  ThumbsUp,
  Star,
  Lock,
  Unlock,
  Flag,
  Shield,
  Settings
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ForumCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  topic_count: number
  post_count: number
  last_activity: string
  is_locked: boolean
  moderators: string[]
}

interface ForumTopic {
  id: string
  title: string
  description?: string
  category_id: string
  author: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
    role?: string
  }
  is_pinned: boolean
  is_locked: boolean
  is_solved: boolean
  reply_count: number
  view_count: number
  last_reply: {
    author: string
    created_at: string
  }
  tags: string[]
  created_at: string
  updated_at: string
}

interface ForumPost {
  id: string
  content: string
  topic_id: string
  author: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
    role?: string
    post_count?: number
    reputation?: number
  }
  is_solution: boolean
  likes: number
  user_liked: boolean
  created_at: string
  updated_at: string
  is_edited: boolean
}

interface DiscussionForumsProps {
  className?: string
}

export default function DiscussionForums({ className }: DiscussionForumsProps) {
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [topics, setTopics] = useState<ForumTopic[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'solved'>('recent')
  const [showCreateTopic, setShowCreateTopic] = useState(false)
  const [newTopicTitle, setNewTopicTitle] = useState('')
  const [newTopicContent, setNewTopicContent] = useState('')
  const [newTopicTags, setNewTopicTags] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      fetchTopics(selectedCategory)
    }
  }, [selectedCategory, searchQuery, sortBy])

  useEffect(() => {
    if (selectedTopic) {
      fetchPosts(selectedTopic)
    }
  }, [selectedTopic])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/forums/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopics = async (categoryId: string) => {
    try {
      const params = new URLSearchParams({
        category_id: categoryId,
        search: searchQuery,
        sort: sortBy
      })
      
      const response = await fetch(`/api/forums/topics?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTopics(data)
      }
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  const fetchPosts = async (topicId: string) => {
    try {
      const response = await fetch(`/api/forums/topics/${topicId}/posts`)
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const createTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim() || !selectedCategory) return

    try {
      const response = await fetch('/api/forums/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTopicTitle,
          content: newTopicContent,
          category_id: selectedCategory,
          tags: newTopicTags.split(',').map(tag => tag.trim()).filter(Boolean)
        })
      })

      if (response.ok) {
        const newTopic = await response.json()
        setTopics(prev => [newTopic, ...prev])
        setNewTopicTitle('')
        setNewTopicContent('')
        setNewTopicTags('')
        setShowCreateTopic(false)
      }
    } catch (error) {
      console.error('Error creating topic:', error)
    }
  }

  const getCategoryIcon = (icon: string) => {
    const iconMap: { [key: string]: any } = {
      'message-square': MessageSquare,
      'users': Users,
      'trending-up': TrendingUp,
      'pin': Pin
    }
    const IconComponent = iconMap[icon] || MessageSquare
    return <IconComponent className="w-5 h-5" />
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
      {/* Forum Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-silas-green" />
                <span>Community Forums</span>
              </CardTitle>
              <CardDescription>
                Engage in discussions, ask questions, and share knowledge
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateTopic(true)}
              className="bg-silas-green hover:bg-silas-green/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Topic
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    selectedCategory === category.id 
                      ? "bg-silas-green text-white" 
                      : "hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "p-2 rounded",
                      selectedCategory === category.id ? "bg-white/20" : category.color
                    )}>
                      {getCategoryIcon(category.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{category.name}</div>
                      <div className={cn(
                        "text-xs",
                        selectedCategory === category.id ? "text-white/80" : "text-gray-500"
                      )}>
                        {category.topic_count} topics
                      </div>
                    </div>
                    {category.is_locked && (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {!selectedTopic ? (
            /* Topics List */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {categories.find(c => c.id === selectedCategory)?.name || 'Topics'}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Search className="w-4 h-4 text-gray-500" />
                      <Input
                        placeholder="Search topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Recent</SelectItem>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="solved">Solved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topics.map(topic => (
                    <div
                      key={topic.id}
                      className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedTopic(topic.id)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={topic.author.avatar_url} />
                        <AvatarFallback>
                          {topic.author.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {topic.is_pinned && (
                                <Pin className="w-4 h-4 text-blue-600" />
                              )}
                              {topic.is_locked && (
                                <Lock className="w-4 h-4 text-gray-500" />
                              )}
                              {topic.is_solved && (
                                <Badge className="bg-green-500 text-white">
                                  Solved
                                </Badge>
                              )}
                              <h3 className="font-semibold hover:text-silas-green">
                                {topic.title}
                              </h3>
                            </div>
                            
                            {topic.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {topic.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>by {topic.author.full_name}</span>
                              <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-3 h-3" />
                                <span>{topic.reply_count}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>{topic.view_count}</span>
                              </div>
                            </div>

                            {topic.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {topic.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          {topic.last_reply && (
                            <div className="text-right text-xs text-gray-500">
                              <div>Last reply by</div>
                              <div className="font-medium">{topic.last_reply.author}</div>
                              <div>{formatDistanceToNow(new Date(topic.last_reply.created_at), { addSuffix: true })}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {topics.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-semibold mb-2">No topics yet</h3>
                      <p className="mb-4">Be the first to start a discussion in this category!</p>
                      <Button
                        onClick={() => setShowCreateTopic(true)}
                        className="bg-silas-green hover:bg-silas-green/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Topic
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Topic View */
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedTopic(null)}
                      className="mb-2"
                    >
                      ← Back to Topics
                    </Button>
                    <CardTitle>
                      {topics.find(t => t.id === selectedTopic)?.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Star className="w-4 h-4 mr-1" />
                      Follow
                    </Button>
                    <Button variant="outline" size="sm">
                      <Flag className="w-4 h-4 mr-1" />
                      Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {posts.map((post, index) => (
                    <div key={post.id} className={cn(
                      "flex items-start space-x-4 p-4 rounded-lg",
                      index === 0 ? "bg-blue-50 border-l-4 border-l-blue-500" : "border"
                    )}>
                      <div className="text-center">
                        <Avatar className="w-12 h-12 mb-2">
                          <AvatarImage src={post.author.avatar_url} />
                          <AvatarFallback>
                            {post.author.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-xs text-gray-500">
                          <div className="font-medium">{post.author.full_name}</div>
                          <div>@{post.author.username}</div>
                          {post.author.role && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {post.author.role}
                            </Badge>
                          )}
                          <div className="mt-1">
                            {post.author.post_count} posts
                          </div>
                          {post.author.reputation && (
                            <div className="flex items-center justify-center space-x-1 mt-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              <span>{post.author.reputation}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {index === 0 && (
                              <Badge className="bg-blue-500 text-white">
                                Original Post
                              </Badge>
                            )}
                            {post.is_solution && (
                              <Badge className="bg-green-500 text-white">
                                ✓ Solution
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                            {post.is_edited && (
                              <span className="text-xs text-gray-400">(edited)</span>
                            )}
                          </div>
                        </div>

                        <div className="prose prose-sm max-w-none mb-4">
                          <p className="whitespace-pre-wrap">{post.content}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <button
                              className={cn(
                                "flex items-center space-x-1 text-sm transition-colors",
                                post.user_liked 
                                  ? "text-blue-600" 
                                  : "text-gray-500 hover:text-blue-600"
                              )}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              <span>{post.likes}</span>
                            </button>
                            <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                              Reply
                            </button>
                            <button className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
                              Quote
                            </button>
                          </div>

                          <div className="flex items-center space-x-2">
                            {index !== 0 && (
                              <button className="text-sm text-green-600 hover:text-green-700 transition-colors">
                                Mark as Solution
                              </button>
                            )}
                            <button className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                              Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Topic Modal */}
      {showCreateTopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader>
              <CardTitle>Create New Topic</CardTitle>
              <CardDescription>
                Start a new discussion in {categories.find(c => c.id === selectedCategory)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Enter topic title..."
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="Describe your topic..."
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  rows={6}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  placeholder="e.g. question, help, discussion"
                  value={newTopicTags}
                  onChange={(e) => setNewTopicTags(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateTopic(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createTopic}
                  disabled={!newTopicTitle.trim() || !newTopicContent.trim()}
                  className="bg-silas-green hover:bg-silas-green/90"
                >
                  Create Topic
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
