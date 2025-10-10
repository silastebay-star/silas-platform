import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createProposalSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50),
  category: z.enum(['infrastructure', 'environment', 'housing', 'business', 'culture', 'safety', 'education', 'governance']),
  action: z.enum(['create_pin', 'edit_pin', 'delete_pin', 'fund_request', 'project_milestone', 'policy_change', 'budget_allocation']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  voting_deadline: z.string().datetime(),
  expected_outcome: z.string().min(20),
  voting_config: z.object({
    requires_quorum: z.boolean(),
    quorum_percentage: z.number().min(10).max(100).optional(),
    allow_abstain: z.boolean(),
    is_anonymous: z.boolean()
  }),
  related_pin_id: z.string().uuid().optional(),
  budget_amount: z.number().min(0).optional(),
  tags: z.array(z.string()).max(10).optional()
})

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)

  const status = searchParams.get('status')
  const category = searchParams.get('category')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('proposals')
    .select(`
      *,
      proposer:users!proposer_id(id, full_name, username, avatar_url),
      related_pin:pins(id, title, latitude, longitude),
      vote_counts:votes(vote)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Process vote counts
  const proposalsWithCounts = data?.map(proposal => {
    const votes = proposal.vote_counts || []
    const voteCounts = votes.reduce((acc: any, vote: any) => {
      acc[vote.vote] = (acc[vote.vote] || 0) + 1
      return acc
    }, { yes: 0, no: 0, abstain: 0 })

    return {
      ...proposal,
      vote_counts: voteCounts,
      total_votes: votes.length
    }
  })

  return NextResponse.json(proposalsWithCounts)
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const formData = await request.formData()

    // Parse basic data
    const proposalData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      action: formData.get('action') as string,
      priority: formData.get('priority') as string,
      voting_deadline: formData.get('voting_deadline') as string,
      expected_outcome: formData.get('expected_outcome') as string,
      voting_config: JSON.parse(formData.get('voting_config') as string),
      related_pin_id: formData.get('related_pin_id') as string || null,
      budget_amount: formData.get('budget_amount') ? parseFloat(formData.get('budget_amount') as string) : null,
      tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : []
    }

    // Validate the data
    const validatedData = createProposalSchema.parse(proposalData)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle file uploads
    const attachmentUrls: string[] = []
    for (let i = 0; i < 5; i++) {
      const file = formData.get(`attachment_${i}`) as File
      if (file && file.size > 0) {
        const fileName = `proposals/${user.id}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('attachments')
          .upload(fileName, file)

        if (uploadError) {
          console.error('File upload error:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(fileName)
          attachmentUrls.push(publicUrl)
        }
      }
    }

    // Create the proposal
    const { data, error } = await supabase
      .from('proposals')
      .insert([
        {
          title: validatedData.title,
          description: validatedData.description,
          category: validatedData.category,
          action: validatedData.action,
          priority: validatedData.priority,
          proposer_id: user.id,
          voting_deadline: validatedData.voting_deadline,
          expected_outcome: validatedData.expected_outcome,
          voting_config: validatedData.voting_config,
          related_pin_id: validatedData.related_pin_id,
          budget_amount: validatedData.budget_amount,
          tags: validatedData.tags,
          attachments: attachmentUrls,
          status: 'pending',
          votes_for: 0,
          votes_against: 0,
          votes_abstain: 0
        }
      ])
      .select(`
        *,
        proposer:users!proposer_id(id, full_name, username, avatar_url),
        related_pin:pins(id, title, latitude, longitude)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create notification for community members
    // This would typically trigger notifications to relevant users

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    console.error('Error creating proposal:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
    return NextResponse.json({
      error: 'Failed to create proposal'
    }, { status: 500 })
  }
}