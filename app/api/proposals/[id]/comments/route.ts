import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  parent_comment_id: z.string().uuid().optional()
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id } = await params

  try {
    // First verify the proposal exists
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id')
      .eq('id', id)
      .single()

    if (proposalError) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Fetch comments with author information
    const { data: comments, error } = await supabase
      .from('proposal_comments')
      .select(`
        id,
        content,
        created_at,
        parent_comment_id,
        author:users!author_id(id, full_name, username, avatar_url)
      `)
      .eq('proposal_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Organize comments into threads (parent comments with their replies)
    const commentMap = new Map()
    const rootComments: any[] = []

    // First pass: create map of all comments
    comments?.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into threads
    comments?.forEach(comment => {
      if (comment.parent_comment_id) {
        // This is a reply
        const parentComment = commentMap.get(comment.parent_comment_id)
        if (parentComment) {
          parentComment.replies.push(commentMap.get(comment.id))
        }
      } else {
        // This is a root comment
        rootComments.push(commentMap.get(comment.id))
      }
    })

    return NextResponse.json(rootComments)

  } catch (error) {
    console.error('Error fetching proposal comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { content, parent_comment_id } = commentSchema.parse(body)

    // Verify the proposal exists
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, status')
      .eq('id', id)
      .single()

    if (proposalError) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check if commenting is allowed (proposal should be active or pending)
    if (proposal.status === 'rejected' || proposal.status === 'expired') {
      return NextResponse.json({ error: 'Comments are not allowed on this proposal' }, { status: 400 })
    }

    // If this is a reply, verify the parent comment exists
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('proposal_comments')
        .select('id')
        .eq('id', parent_comment_id)
        .eq('proposal_id', id)
        .single()

      if (parentError) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 })
      }
    }

    // Create the comment
    const { data: comment, error } = await supabase
      .from('proposal_comments')
      .insert([{
        proposal_id: id,
        author_id: user.id,
        content,
        parent_comment_id: parent_comment_id || null
      }])
      .select(`
        id,
        content,
        created_at,
        parent_comment_id,
        author:users!author_id(id, full_name, username, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Create notification for proposal author (if not commenting on own proposal)
    const { data: proposalDetails } = await supabase
      .from('proposals')
      .select('proposer_id, title')
      .eq('id', id)
      .single()

    if (proposalDetails && proposalDetails.proposer_id !== user.id) {
      // Create notification (implementation depends on your notification system)
      await supabase
        .from('notifications')
        .insert([{
          user_id: proposalDetails.proposer_id,
          type: 'proposal_comment',
          title: 'New comment on your proposal',
          message: `${user.email} commented on "${proposalDetails.title}"`,
          data: {
            proposal_id: id,
            comment_id: comment.id
          }
        }])
        .catch(err => console.error('Failed to create notification:', err))
    }

    return NextResponse.json(comment, { status: 201 })

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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('comment_id')

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    // Check if user owns the comment or is admin
    const { data: comment, error: commentError } = await supabase
      .from('proposal_comments')
      .select('author_id')
      .eq('id', commentId)
      .eq('proposal_id', id)
      .single()

    if (commentError) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.role === 'admin'
    const isAuthor = comment.author_id === user.id

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Delete the comment (this will cascade to replies if any)
    const { error } = await supabase
      .from('proposal_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Comment deleted successfully' })

  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
