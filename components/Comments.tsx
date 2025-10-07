'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, Reply, Flag, Edit, Trash2, User, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useCommentsStore, type Comment } from '@/store/comments'

interface CommentsProps {
  pinId: string
}

interface CommentItemProps {
  comment: Comment
  pinId: string
  depth?: number
}

function CommentItem({ comment, pinId, depth = 0 }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const { addComment, flagComment, deleteComment } = useCommentsStore()

  const handleReply = async () => {
    if (!replyText.trim()) return
    
    const newComment = await addComment(pinId, replyText, comment.id)
    if (newComment) {
      setReplyText('')
      setIsReplying(false)
    }
  }

  const handleFlag = () => {
    flagComment(comment.id)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(comment.id)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const isOptimistic = comment.id.startsWith('temp_')
  const maxDepth = 3

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''}`}>
      <div className="flex space-x-3 group">
        {/* Avatar */}
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          {comment.user_profile?.avatar_url ? (
            <img
              src={comment.user_profile.avatar_url}
              alt={comment.user_profile.display_name || 'User'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-gray-600" />
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm text-gray-900">
                  {comment.user_profile?.display_name || 'Anonymous'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(comment.created_at)}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-gray-400">(edited)</span>
                )}
                {isOptimistic && (
                  <span className="text-xs text-blue-500">(sending...)</span>
                )}
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="">
                  <DropdownMenuItem onClick={() => setIsReplying(true)} className="" inset={false}>
                    <Reply className="w-4 h-4 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFlag} className="" inset={false}>
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                  {/* TODO: Show edit/delete only for own comments */}
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600" inset={false}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          {/* Reply Button */}
          {!isReplying && depth < maxDepth && (
            <button
              onClick={() => setIsReplying(true)}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <Reply className="w-3 h-3" />
              <span>Reply</span>
            </button>
          )}

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="text-sm resize-none"
                rows={2}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className=""
                  onClick={() => {
                    setIsReplying(false)
                    setReplyText('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="bg-silas-green hover:bg-silas-green/90"
                >
                  Reply
                </Button>
              </div>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  pinId={pinId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Comments({ pinId }: CommentsProps) {
  const [commentText, setCommentText] = useState('')
  const { comments, isLoading, error, fetchComments, addComment } = useCommentsStore()

  const pinComments = comments[pinId] || []

  useEffect(() => {
    fetchComments(pinId)
  }, [pinId, fetchComments])

  const handleSubmit = async () => {
    if (!commentText.trim()) return
    
    const newComment = await addComment(pinId, commentText)
    if (newComment) {
      setCommentText('')
    }
  }

  if (isLoading && pinComments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="resize-none"
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={!commentText.trim()}
            className="bg-silas-green hover:bg-silas-green/90"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Post Comment
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {pinComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        ) : (
          pinComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              pinId={pinId}
            />
          ))
        )}
      </div>
    </div>
  )
}
