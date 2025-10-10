/**
 * Comment System Component
 * Threaded comments with replies, reactions, and moderation tools
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageCircle, 
  Reply, 
  Heart, 
  ThumbsUp, 
  ThumbsDown,
  MoreHorizontal,
  Flag,
  Edit,
  Trash2,
  Send,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  author: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
    role?: string
  }
  parent_comment_id?: string
  reactions: {
    likes: number
    dislikes: number
    hearts: number
    user_reaction?: 'like' | 'dislike' | 'heart'
  }
  replies: Comment[]
  is_edited: boolean
  is_deleted: boolean
  is_hidden: boolean
  moderation_status: 'approved' | 'pending' | 'flagged' | 'removed'
  created_at: string
  updated_at: string
}

interface CommentSystemProps {
  targetType: 'pin' | 'proposal' | 'project' | 'feed_item'
  targetId: string
  currentUserId?: string
  canModerate?: boolean
  className?: string
}

export default function CommentSystem({ 
  targetType, 
  targetId, 
  currentUserId,
  canModerate = false,
  className 
}: CommentSystemProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showHidden, setShowHidden] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [targetType, targetId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/comments?target_type=${targetType}&target_id=${targetId}`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          content: newComment
        })
      })

      if (response.ok) {
        const comment = await response.json()
        setComments(prev => [comment, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    }
  }

  const submitReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          content: replyContent,
          parent_comment_id: parentId
        })
      })

      if (response.ok) {
        const reply = await response.json()
        setComments(prev => prev.map(comment => 
          comment.id === parentId 
            ? { ...comment, replies: [...comment.replies, reply] }
            : comment
        ))
        setReplyContent('')
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  const editComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })

      if (response.ok) {
        const updatedComment = await response.json()
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: updatedComment.content, is_edited: true }
            : {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === commentId 
                    ? { ...reply, content: updatedComment.content, is_edited: true }
                    : reply
                )
              }
        ))
        setEditingComment(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, is_deleted: true, content: '[Comment deleted]' }
            : {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === commentId 
                    ? { ...reply, is_deleted: true, content: '[Comment deleted]' }
                    : reply
                )
              }
        ))
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const reactToComment = async (commentId: string, reaction: 'like' | 'dislike' | 'heart') => {
    try {
      const response = await fetch(`/api/comments/${commentId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, reactions: data.reactions }
            : {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === commentId 
                    ? { ...reply, reactions: data.reactions }
                    : reply
                )
              }
        ))
      }
    } catch (error) {
      console.error('Error reacting to comment:', error)
    }
  }

  const moderateComment = async (commentId: string, action: 'approve' | 'hide' | 'remove' | 'flag') => {
    try {
      const response = await fetch(`/api/comments/${commentId}/moderate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        const data = await response.json()
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, moderation_status: data.status, is_hidden: data.is_hidden }
            : {
                ...comment,
                replies: comment.replies.map(reply =>
                  reply.id === commentId 
                    ? { ...reply, moderation_status: data.status, is_hidden: data.is_hidden }
                    : reply
                )
              }
        ))
      }
    } catch (error) {
      console.error('Error moderating comment:', error)
    }
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = currentUserId === comment.author.id
    const shouldShow = !comment.is_hidden || showHidden || canModerate

    if (!shouldShow) return null

    return (
      <div key={comment.id} className={cn(
        "space-y-3",
        isReply && "ml-8 pl-4 border-l-2 border-gray-200",
        comment.is_hidden && "opacity-60"
      )}>
        <div className="flex items-start space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.author.avatar_url} />
            <AvatarFallback>
              {comment.author.full_name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-sm">{comment.author.full_name}</span>
              <span className="text-xs text-gray-500">@{comment.author.username}</span>
              {comment.author.role && (
                <Badge variant="outline" className="text-xs">
                  {comment.author.role}
                </Badge>
              )}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
              {comment.is_edited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
              {comment.moderation_status === 'flagged' && (
                <Badge variant="destructive" className="text-xs">
                  Flagged
                </Badge>
              )}
            </div>

            {editingComment === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => editComment(comment.id)}>
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingComment(null)
                      setEditContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className={cn(
                  "text-sm text-gray-700 whitespace-pre-wrap",
                  comment.is_deleted && "italic text-gray-500"
                )}>
                  {comment.content}
                </p>

                {comment.moderation_status === 'pending' && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This comment is pending moderation.
                    </AlertDescription>
                  </Alert>
                )}

                {!comment.is_deleted && (
                  <div className="flex items-center space-x-4 mt-2">
                    {/* Reactions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => reactToComment(comment.id, 'like')}
                        className={cn(
                          "flex items-center space-x-1 text-xs transition-colors",
                          comment.reactions.user_reaction === 'like' 
                            ? "text-blue-600" 
                            : "text-gray-500 hover:text-blue-600"
                        )}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{comment.reactions.likes}</span>
                      </button>

                      <button
                        onClick={() => reactToComment(comment.id, 'heart')}
                        className={cn(
                          "flex items-center space-x-1 text-xs transition-colors",
                          comment.reactions.user_reaction === 'heart' 
                            ? "text-red-600" 
                            : "text-gray-500 hover:text-red-600"
                        )}
                      >
                        <Heart className={cn(
                          "w-3 h-3",
                          comment.reactions.user_reaction === 'heart' && "fill-current"
                        )} />
                        <span>{comment.reactions.hearts}</span>
                      </button>

                      <button
                        onClick={() => reactToComment(comment.id, 'dislike')}
                        className={cn(
                          "flex items-center space-x-1 text-xs transition-colors",
                          comment.reactions.user_reaction === 'dislike' 
                            ? "text-red-600" 
                            : "text-gray-500 hover:text-red-600"
                        )}
                      >
                        <ThumbsDown className="w-3 h-3" />
                        <span>{comment.reactions.dislikes}</span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {!isReply && (
                        <button
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          Reply
                        </button>
                      )}

                      {isOwner && (
                        <>
                          <button
                            onClick={() => {
                              setEditingComment(comment.id)
                              setEditContent(comment.content)
                            }}
                            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteComment(comment.id)}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {!isOwner && (
                        <button
                          onClick={() => moderateComment(comment.id, 'flag')}
                          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Report
                        </button>
                      )}

                      {canModerate && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => moderateComment(comment.id, comment.is_hidden ? 'approve' : 'hide')}
                            className="text-xs text-gray-500 hover:text-orange-600 transition-colors"
                          >
                            {comment.is_hidden ? 'Show' : 'Hide'}
                          </button>
                          <button
                            onClick={() => moderateComment(comment.id, 'remove')}
                            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Reply form */}
            {replyingTo === comment.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Write a reply..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={() => submitReply(comment.id)}>
                    <Send className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-silas-green" />
      </div>
    )
  }

  const visibleComments = comments.filter(comment => 
    !comment.is_hidden || showHidden || canModerate
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Comment form */}
      {currentUserId && (
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Be respectful and constructive in your comments
            </div>
            <Button 
              onClick={submitComment}
              disabled={!newComment.trim()}
              className="bg-silas-green hover:bg-silas-green/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Comment
            </Button>
          </div>
        </div>
      )}

      {/* Moderation controls */}
      {canModerate && (
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">Moderation:</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowHidden(!showHidden)}
          >
            {showHidden ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
            {showHidden ? 'Hide' : 'Show'} Hidden Comments
          </Button>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-6">
        {visibleComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          visibleComments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}
