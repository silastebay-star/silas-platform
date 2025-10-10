import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createCommentSchema = z.object({
  target_type: z.enum(['pin', 'proposal', 'project', 'feed_item']),
  target_id: z.string().uuid(),
  content: z.string().min(1).max(2000),
  parent_comment_id: z.string().uuid().optional()
})

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  const targetType = searchParams.get('target_type')
  const targetId = searchParams.get('target_id')

  if (!targetType || !targetId) {
    return NextResponse.json({ error: 'target_type and target_id are required' }, { status: 400 })
  }

  try {
    // Fetch comments with nested replies
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        parent_comment_id,
        is_edited,
        is_deleted,
        is_hidden,
        moderation_status,
        created_at,
        updated_at,
        author:users!author_id(id, full_name, username, avatar_url, role),
        reactions:comment_reactions(
          reaction_type,
          count
        )
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Get current user to check their reactions
    const { data: { user } } = await supabase.auth.getUser()
    let userReactions: any[] = []
    
    if (user && comments) {
      const { data: reactions } = await supabase
        .from('user_comment_reactions')
        .select('comment_id, reaction_type')
        .eq('user_id', user.id)
        .in('comment_id', comments.map(c => c.id))
      
      userReactions = reactions || []
    }

    // Organize comments into threads
    const commentMap = new Map()
    const rootComments: any[] = []

    // Process reactions and user engagement
    const processedComments = comments.map(comment => {
      const reactionCounts = comment.reactions.reduce((acc: any, r: any) => {
        acc[r.reaction_type] = r.count
        return acc
      }, { likes: 0, dislikes: 0, hearts: 0 })

      const userReaction = userReactions.find(r => r.comment_id === comment.id)

      return {
        ...comment,
        reactions: {
          ...reactionCounts,
          user_reaction: userReaction?.reaction_type
        },
        replies: []
      }
    })

    // Build comment map
    processedComments.forEach(comment => {
      commentMap.set(comment.id, comment)
    })

    // Organize into threads
    processedComments.forEach(comment => {
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          parent.replies.push(comment)
        }
      } else {
        rootComments.push(comment)
      }
    })

    // Sort replies by creation date
    rootComments.forEach(comment => {
      comment.replies.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    })

    return NextResponse.json(rootComments)

  } catch (error) {
    console.error('Error in comments API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { target_type, target_id, content, parent_comment_id } = createCommentSchema.parse(body)

    // Verify target exists
    let targetExists = false
    switch (target_type) {
      case 'pin':
        const { data: pin } = await supabase.from('pins').select('id').eq('id', target_id).single()
        targetExists = !!pin
        break
      case 'proposal':
        const { data: proposal } = await supabase.from('proposals').select('id').eq('id', target_id).single()
        targetExists = !!proposal
        break
      case 'project':
        const { data: project } = await supabase.from('projects').select('id').eq('id', target_id).single()
        targetExists = !!project
        break
      case 'feed_item':
        const { data: feedItem } = await supabase.from('feed_items').select('id').eq('id', target_id).single()
        targetExists = !!feedItem
        break
    }

    if (!targetExists) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    // Verify parent comment exists if specified
    if (parent_comment_id) {
      const { data: parentComment } = await supabase
        .from('comments')
        .select('id')
        .eq('id', parent_comment_id)
        .eq('target_type', target_type)
        .eq('target_id', target_id)
        .single()

      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert([{
        target_type,
        target_id,
        content,
        parent_comment_id,
        author_id: user.id,
        moderation_status: 'approved' // Auto-approve for now, can add moderation logic
      }])
      .select(`
        id,
        content,
        parent_comment_id,
        is_edited,
        is_deleted,
        is_hidden,
        moderation_status,
        created_at,
        updated_at,
        author:users!author_id(id, full_name, username, avatar_url, role)
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Initialize reaction counts
    await supabase
      .from('comment_reactions')
      .insert([
        { comment_id: comment.id, reaction_type: 'likes', count: 0 },
        { comment_id: comment.id, reaction_type: 'dislikes', count: 0 },
        { comment_id: comment.id, reaction_type: 'hearts', count: 0 }
      ])
      .catch(err => console.error('Failed to initialize reaction counts:', err))

    // Create activity log
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: 'created_comment',
        target_type: 'comment',
        target_id: comment.id,
        metadata: { target_type, target_id, parent_comment_id }
      }])
      .catch(err => console.error('Failed to log activity:', err))

    // Format response
    const response = {
      ...comment,
      reactions: {
        likes: 0,
        dislikes: 0,
        hearts: 0,
        user_reaction: undefined
      },
      replies: []
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating comment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid comment data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
