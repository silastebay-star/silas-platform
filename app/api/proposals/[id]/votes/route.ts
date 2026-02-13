
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id } = await params

  const { data, error } = await supabase
    .from('votes')
    .select('vote')
    .eq('proposal_id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const voteCounts = data.reduce((acc, { vote }) => {
    acc[vote] = (acc[vote] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json(voteCounts)
}
