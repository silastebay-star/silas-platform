import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  
  const supabase = createSupabaseServerClient()

  try {
    const { searchParams } = new URL(request.url)
    const proposal_id = searchParams.get('proposal_id')

    if (!proposal_id) {
      return NextResponse.json({ error: 'proposal_id is required' }, { status: 400 })
    }

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