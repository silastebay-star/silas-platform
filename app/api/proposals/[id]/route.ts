import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id } = await params

  try {
    const { data: proposal, error } = await supabase
      .from('proposals')
      .select(`
        *,
        proposer:users!proposer_id(id, full_name, username, avatar_url),
        related_pin:pins(id, title, latitude, longitude)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get vote counts
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('vote')
      .eq('proposal_id', id)

    if (votesError) {
      console.error('Error fetching votes:', votesError)
    }

    const voteCounts = votes?.reduce((acc: any, vote: any) => {
      acc[vote.vote] = (acc[vote.vote] || 0) + 1
      return acc
    }, { yes: 0, no: 0, abstain: 0 }) || { yes: 0, no: 0, abstain: 0 }

    const proposalWithVotes = {
      ...proposal,
      votes_for: voteCounts.yes,
      votes_against: voteCounts.no,
      votes_abstain: voteCounts.abstain,
      total_votes: votes?.length || 0
    }

    return NextResponse.json(proposalWithVotes)

  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json({ error: 'Failed to fetch proposal' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, reviewer_notes } = body

    // Check if user has permission to update proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('proposer_id')
      .eq('id', id)
      .single()

    if (proposalError) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Only proposer or admin can update
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = userProfile?.role === 'admin'
    const isProposer = proposal.proposer_id === user.id

    if (!isAdmin && !isProposer) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (reviewer_notes) updateData.reviewer_notes = reviewer_notes
    if (status && (status === 'approved' || status === 'rejected')) {
      updateData.reviewed_at = new Date().toISOString()
      updateData.reviewed_by = user.id
    }

    const { data, error } = await supabase
      .from('proposals')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        proposer:users!proposer_id(id, full_name, username, avatar_url),
        related_pin:pins(id, title, latitude, longitude)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 })
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to delete proposal
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('proposer_id, status')
      .eq('id', id)
      .single()

    if (proposalError) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Only proposer can delete, and only if not yet approved/rejected
    if (proposal.proposer_id !== user.id) {
      return NextResponse.json({ error: 'Only the proposer can delete this proposal' }, { status: 403 })
    }

    if (proposal.status === 'approved' || proposal.status === 'rejected') {
      return NextResponse.json({ error: 'Cannot delete approved or rejected proposals' }, { status: 400 })
    }

    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Proposal deleted successfully' })

  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 })
  }
}
