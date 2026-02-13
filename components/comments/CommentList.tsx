
'use client'

import { useState, useEffect } from 'react'
import { CommentForm } from './CommentForm'

interface Comment {
  id: string
  content: string
  author_id: string
  created_at: string
}

interface CommentListProps {
  pinId: string
}

export function CommentList({ pinId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchComments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/pins/${pinId}/comments`)
      if (!response.ok) {
        throw new Error('Failed to fetch comments')
      }
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (pinId) {
      fetchComments()
    }
  }, [pinId])

  const handleCommentAdded = (newComment: Comment) => {
    setComments([newComment, ...comments])
  }

  if (isLoading) {
    return <div>Loading comments...</div>
  }

  return (
    <div>
      <CommentForm pinId={pinId} onCommentAdded={handleCommentAdded} />
      <div className="space-y-4 mt-4">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-800">{comment.content}</p>
            <div className="text-xs text-gray-500 mt-2">
              <span>by {comment.author_id}</span>
              <span className="mx-2">•</span>
              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
