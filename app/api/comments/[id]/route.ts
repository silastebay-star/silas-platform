import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000)
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id: commentId } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = updateCommentSchema.parse(body)

    // Check if user owns the comment
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('author_id, is_deleted')
      .eq('id', commentId)
      .single()

    if (commentError) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.author_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (comment.is_deleted) {
      return NextResponse.json({ error: 'Cannot edit deleted comment' }, { status: 400 })
    }

    // Update comment
    const { data: updatedComment, error } = await supabase
      .from('comments')
      .update({ 
        content, 
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('content, is_edited, updated_at')
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: 'edited_comment',
        target_type: 'comment',
        target_id: commentId
      }])
      .catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json(updatedComment)

  } catch (error) {
    console.error('Error updating comment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid comment data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id: commentId } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user owns the comment or has moderation rights
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('author_id, is_deleted')
      .eq('id', commentId)
      .single()

    if (commentError) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    // Check user permissions
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = comment.author_id === user.id
    const isModerator = userProfile?.role === 'admin' || userProfile?.role === 'moderator'

    if (!isOwner && !isModerator) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (comment.is_deleted) {
      return NextResponse.json({ error: 'Comment already deleted' }, { status: 400 })
    }

    // Soft delete comment
    const { error } = await supabase
      .from('comments')
      .update({ 
        is_deleted: true,
        content: '[Comment deleted]',
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: isOwner ? 'deleted_own_comment' : 'moderated_comment',
        target_type: 'comment',
        target_id: commentId
      }])
      .catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
