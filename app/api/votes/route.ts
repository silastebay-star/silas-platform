import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { z } from 'zod'

const voteSchema = z.object({
  proposal_id: z.string().uuid(),
  vote: z.enum(['yes', 'no', 'abstain']),
  comment: z.string().max(500).optional()
})

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const proposal_id = searchParams.get('proposal_id')
    const user_id = searchParams.get('user_id')

    if (!proposal_id) {
      return NextResponse.json({ error: 'proposal_id is required' }, { status: 400 })
    }

    // If user_id is provided, get the specific user's vote
    if (user_id) {
      const { data: userVote, error } = await supabase
        .from('votes')
        .select('vote, comment, created_at')
        .eq('proposal_id', proposal_id)
        .eq('voter_id', user_id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching user vote:', error)
        return NextResponse.json({ error: 'Failed to fetch user vote' }, { status: 500 })
      }

      return NextResponse.json(userVote || null)
    }

    // Otherwise, get vote counts
    const { data: votes, error } = await supabase
      .from('votes')
      .select('vote')
      .eq('proposal_id', proposal_id)

    if (error) {
      console.error('Error fetching votes:', error)
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 })
    }

    const voteCounts = votes.reduce((acc, curr) => {
      if (curr.vote === 'yes') acc.yes++
      else if (curr.vote === 'no') acc.no++
      else if (curr.vote === 'abstain') acc.abstain++
      return acc
    }, { yes: 0, no: 0, abstain: 0 })

    return NextResponse.json(voteCounts)
  } catch (e) {
    console.error('Unexpected error fetching vote counts:', e)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const body = await request.json()
    const { proposal_id, vote, comment } = voteSchema.parse(body)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if proposal exists and is active
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .select('id, status, voting_deadline, voting_config')
      .eq('id', proposal_id)
      .single()

    if (proposalError) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    // Check if voting is still open
    const now = new Date()
    const deadline = new Date(proposal.voting_deadline)
    if (now > deadline) {
      return NextResponse.json({ error: 'Voting has closed' }, { status: 400 })
    }

    if (proposal.status !== 'active') {
      return NextResponse.json({ error: 'Voting is not active for this proposal' }, { status: 400 })
    }

    // Check if abstain is allowed
    if (vote === 'abstain' && !proposal.voting_config?.allow_abstain) {
      return NextResponse.json({ error: 'Abstain votes are not allowed for this proposal' }, { status: 400 })
    }

    // Check if user has already voted
    const { data: existingVote, error: voteCheckError } = await supabase
      .from('votes')
      .select('id')
      .eq('proposal_id', proposal_id)
      .eq('voter_id', user.id)
      .single()

    if (voteCheckError && voteCheckError.code !== 'PGRST116') {
      console.error('Error checking existing vote:', voteCheckError)
      return NextResponse.json({ error: 'Failed to check existing vote' }, { status: 500 })
    }

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted on this proposal' }, { status: 400 })
    }

    // Cast the vote
    const { data: newVote, error: insertError } = await supabase
      .from('votes')
      .insert([{
        proposal_id,
        voter_id: user.id,
        vote,
        comment: comment || null
      }])
      .select('*')
      .single()

    if (insertError) {
      console.error('Error inserting vote:', insertError)
      return NextResponse.json({ error: 'Failed to cast vote' }, { status: 500 })
    }

    // Update proposal vote counts
    const voteField = vote === 'yes' ? 'votes_for' : vote === 'no' ? 'votes_against' : 'votes_abstain'
    const { error: updateError } = await supabase
      .from('proposals')
      .update({ [voteField]: proposal[voteField] + 1 })
      .eq('id', proposal_id)

    if (updateError) {
      console.error('Error updating proposal vote counts:', updateError)
      // Note: We don't return an error here as the vote was successfully recorded
    }

    // Create notification for proposal creator (if not anonymous)
    if (!proposal.voting_config?.is_anonymous) {
      // This would typically trigger a notification
      // Implementation depends on your notification system
    }

    return NextResponse.json(newVote, { status: 201 })

  } catch (error) {
    console.error('Error processing vote:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid vote data',
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to process vote' }, { status: 500 })
  }
}