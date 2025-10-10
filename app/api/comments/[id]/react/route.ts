import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reactionSchema = z.object({
  reaction: z.enum(['like', 'dislike', 'heart'])
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
    const { reaction } = reactionSchema.parse(body)

    // Check if comment exists
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, is_deleted')
      .eq('id', commentId)
      .single()

    if (commentError) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.is_deleted) {
      return NextResponse.json({ error: 'Cannot react to deleted comment' }, { status: 400 })
    }

    // Check existing user reaction
    const { data: existingReaction, error: reactionError } = await supabase
      .from('user_comment_reactions')
      .select('reaction_type')
      .eq('user_id', user.id)
      .eq('comment_id', commentId)
      .single()

    if (reactionError && reactionError.code !== 'PGRST116') {
      console.error('Error checking existing reaction:', reactionError)
      return NextResponse.json({ error: 'Failed to check reaction status' }, { status: 500 })
    }

    const currentReaction = existingReaction?.reaction_type
    const isSameReaction = currentReaction === reaction

    // If same reaction, remove it; otherwise, update/insert
    if (isSameReaction) {
      // Remove reaction
      await supabase
        .from('user_comment_reactions')
        .delete()
        .eq('user_id', user.id)
        .eq('comment_id', commentId)
    } else {
      // Update or insert reaction
      await supabase
        .from('user_comment_reactions')
        .upsert({
          user_id: user.id,
          comment_id: commentId,
          reaction_type: reaction
        })
    }

    // Update reaction counts
    const { data: reactionCounts, error: countError } = await supabase
      .from('user_comment_reactions')
      .select('reaction_type')
      .eq('comment_id', commentId)

    if (countError) {
      console.error('Error fetching reaction counts:', countError)
      return NextResponse.json({ error: 'Failed to update reaction counts' }, { status: 500 })
    }

    // Calculate new counts
    const counts = reactionCounts.reduce((acc: any, r: any) => {
      acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
      return acc
    }, { likes: 0, dislikes: 0, hearts: 0 })

    // Update reaction counts in database
    await Promise.all([
      supabase
        .from('comment_reactions')
        .upsert({ comment_id: commentId, reaction_type: 'likes', count: counts.likes || 0 }),
      supabase
        .from('comment_reactions')
        .upsert({ comment_id: commentId, reaction_type: 'dislikes', count: counts.dislikes || 0 }),
      supabase
        .from('comment_reactions')
        .upsert({ comment_id: commentId, reaction_type: 'hearts', count: counts.hearts || 0 })
    ])

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: isSameReaction ? 'removed_comment_reaction' : 'added_comment_reaction',
        target_type: 'comment',
        target_id: commentId,
        metadata: { reaction_type: reaction }
      }])
      .catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({
      reactions: {
        likes: counts.likes || 0,
        dislikes: counts.dislikes || 0,
        hearts: counts.hearts || 0,
        user_reaction: isSameReaction ? undefined : reaction
      }
    })

  } catch (error) {
    console.error('Error processing reaction:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid reaction data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to process reaction' }, { status: 500 })
  }
}
