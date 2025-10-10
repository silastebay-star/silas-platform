'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Post {
  id: string
  content: string
  author_id: string
  created_at: string
}

export function NeighborhoodFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      })
    })
  }, [])

  const fetchPosts = async (bbox: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/posts?bbox=${bbox}`)
      if (!response.ok) {
        throw new Error('Failed to fetch posts')
      }
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (location) {
      // Create a bounding box around the user's location
      const radius = 0.01 // ~1km
      const bbox = [
        location.lng - radius,
        location.lat - radius,
        location.lng + radius,
        location.lat + radius,
      ].join(',')
      fetchPosts(bbox)
    }
  }, [location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !location) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, ...location }),
      })

      if (!response.ok) {
        throw new Error('Failed to add post')
      }

      const newPost = await response.json()
      setPosts([newPost[0], ...posts])
      setContent('')
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div>Loading posts...</div>
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          disabled={isSubmitting}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Post'}
        </Button>
      </form>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-800">{post.content}</p>
            <div className="text-xs text-gray-500 mt-2">
              <span>by {post.author_id}</span>
              <span className="mx-2">•</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}