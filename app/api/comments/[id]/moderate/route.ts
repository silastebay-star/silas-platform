import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const moderationSchema = z.object({
  action: z.enum(['approve', 'hide', 'remove', 'flag'])
})

export async function POST(
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
    const { action } = moderationSchema.parse(body)

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, author_id, moderation_status, is_hidden')
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

    const isModerator = userProfile?.role === 'admin' || userProfile?.role === 'moderator'
    const isOwner = comment.author_id === user.id

    // Only moderators can perform moderation actions (except flagging)
    if (action !== 'flag' && !isModerator) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Users can't flag their own comments
    if (action === 'flag' && isOwner) {
      return NextResponse.json({ error: 'Cannot flag your own comment' }, { status: 400 })
    }

    let updateData: any = {}
    let newStatus = comment.moderation_status
    let isHidden = comment.is_hidden

    switch (action) {
      case 'approve':
        updateData = {
          moderation_status: 'approved',
          is_hidden: false
        }
        newStatus = 'approved'
        isHidden = false
        break

      case 'hide':
        updateData = {
          moderation_status: 'pending',
          is_hidden: true
        }
        newStatus = 'pending'
        isHidden = true
        break

      case 'remove':
        updateData = {
          moderation_status: 'removed',
          is_hidden: true,
          is_deleted: true,
          content: '[Comment removed by moderator]'
        }
        newStatus = 'removed'
        isHidden = true
        break

      case 'flag':
        // Create flag record
        await supabase
          .from('comment_flags')
          .insert([{
            comment_id: commentId,
            flagger_id: user.id,
            reason: 'inappropriate_content', // Could be made configurable
            status: 'pending'
          }])
          .catch(err => console.error('Failed to create flag:', err))

        // Update comment status if not already flagged
        if (comment.moderation_status !== 'flagged') {
          updateData = {
            moderation_status: 'flagged'
          }
          newStatus = 'flagged'
        }
        break
    }

    // Update comment if there are changes
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('comments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (updateError) {
        console.error('Error updating comment:', updateError)
        return NextResponse.json({ error: 'Failed to moderate comment' }, { status: 500 })
      }
    }

    // Create moderation log
    await supabase
      .from('moderation_log')
      .insert([{
        moderator_id: user.id,
        target_type: 'comment',
        target_id: commentId,
        action,
        reason: action === 'flag' ? 'User reported content' : `Moderator ${action}d comment`,
        previous_status: comment.moderation_status,
        new_status: newStatus
      }])
      .catch(err => console.error('Failed to log moderation action:', err))

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: `${action}_comment`,
        target_type: 'comment',
        target_id: commentId,
        metadata: { 
          previous_status: comment.moderation_status,
          new_status: newStatus
        }
      }])
      .catch(err => console.error('Failed to log activity:', err))

    // Send notification to comment author if moderated
    if (action !== 'approve' && action !== 'flag' && comment.author_id !== user.id) {
      await supabase
        .from('notifications')
        .insert([{
          user_id: comment.author_id,
          type: 'comment_moderated',
          title: 'Comment Moderated',
          message: `Your comment has been ${action}d by a moderator.`,
          data: {
            comment_id: commentId,
            action,
            moderator_id: user.id
          }
        }])
        .catch(err => console.error('Failed to send notification:', err))
    }

    // Send notification to moderators if flagged
    if (action === 'flag') {
      const { data: moderators } = await supabase
        .from('users')
        .select('id')
        .in('role', ['admin', 'moderator'])

      if (moderators) {
        const notifications = moderators.map(mod => ({
          user_id: mod.id,
          type: 'comment_flagged',
          title: 'Comment Flagged',
          message: 'A comment has been flagged for review.',
          data: {
            comment_id: commentId,
            flagger_id: user.id
          }
        }))

        await supabase
          .from('notifications')
          .insert(notifications)
          .catch(err => console.error('Failed to send moderator notifications:', err))
      }
    }

    return NextResponse.json({
      status: newStatus,
      is_hidden: isHidden,
      action_taken: action
    })

  } catch (error) {
    console.error('Error moderating comment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid moderation data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to moderate comment' }, { status: 500 })
  }
}
