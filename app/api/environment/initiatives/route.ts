import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createInitiativeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.enum(['renewable_energy', 'waste_reduction', 'conservation', 'transportation', 'education']),
  target_date: z.string(),
  budget: z.number().min(0),
  pin_id: z.string().uuid().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional()
})

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  const pinId = searchParams.get('pin_id')
  const category = searchParams.get('category')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let query = supabase
      .from('green_initiatives')
      .select(`
        id,
        title,
        description,
        category,
        status,
        progress,
        target_date,
        budget,
        participants_count,
        impact_metrics,
        location,
        created_at,
        updated_at,
        author:users!created_by(id, full_name, username, avatar_url),
        pin:pins(id, title, latitude, longitude)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (pinId) {
      query = query.eq('pin_id', pinId)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: initiatives, error } = await query

    if (error) {
      console.error('Error fetching green initiatives:', error)
      return NextResponse.json({ error: 'Failed to fetch initiatives' }, { status: 500 })
    }

    // Process the data
    const processedInitiatives = initiatives?.map(initiative => ({
      id: initiative.id,
      title: initiative.title,
      description: initiative.description,
      category: initiative.category,
      status: initiative.status,
      progress: initiative.progress || 0,
      target_date: initiative.target_date,
      budget: initiative.budget || 0,
      participants: initiative.participants_count || 0,
      impact_metrics: initiative.impact_metrics || {
        co2_reduction: 0,
        energy_saved: 0,
        waste_diverted: 0
      },
      location: initiative.location ? {
        latitude: initiative.location.coordinates[1],
        longitude: initiative.location.coordinates[0],
        address: `${initiative.location.coordinates[1].toFixed(4)}, ${initiative.location.coordinates[0].toFixed(4)}`
      } : null,
      author: initiative.author,
      pin: initiative.pin,
      created_at: initiative.created_at,
      updated_at: initiative.updated_at
    })) || []

    return NextResponse.json(processedInitiatives)

  } catch (error) {
    console.error('Error in green initiatives API:', error)
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
    const { title, description, category, target_date, budget, pin_id, location } = createInitiativeSchema.parse(body)

    // Create the initiative
    const { data: initiative, error } = await supabase
      .from('green_initiatives')
      .insert([{
        title,
        description,
        category,
        target_date,
        budget,
        pin_id,
        location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
        created_by: user.id,
        status: 'planning',
        progress: 0,
        participants_count: 1,
        impact_metrics: {
          co2_reduction: 0,
          energy_saved: 0,
          waste_diverted: 0
        }
      }])
      .select(`
        id,
        title,
        description,
        category,
        status,
        progress,
        target_date,
        budget,
        participants_count,
        impact_metrics,
        location,
        created_at,
        updated_at,
        author:users!created_by(id, full_name, username, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating green initiative:', error)
      return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 })
    }

    // Add creator as first participant
    await supabase
      .from('initiative_participants')
      .insert([{
        initiative_id: initiative.id,
        user_id: user.id,
        role: 'organizer',
        joined_at: new Date().toISOString()
      }])
      .catch(err => console.error('Failed to add creator as participant:', err))

    // Create activity log
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: 'created_green_initiative',
        target_type: 'green_initiative',
        target_id: initiative.id,
        metadata: { category, pin_id }
      }])
      .catch(err => console.error('Failed to log activity:', err))

    // Create feed item
    await supabase
      .from('feed_items')
      .insert([{
        type: 'green_initiative_created',
        author_id: user.id,
        content: {
          title: `New Green Initiative: ${title}`,
          description,
          category,
          initiative_id: initiative.id
        },
        related_pin_id: pin_id
      }])
      .catch(err => console.error('Failed to create feed item:', err))

    // Format response
    const response = {
      id: initiative.id,
      title: initiative.title,
      description: initiative.description,
      category: initiative.category,
      status: initiative.status,
      progress: initiative.progress,
      target_date: initiative.target_date,
      budget: initiative.budget,
      participants: initiative.participants_count,
      impact_metrics: initiative.impact_metrics,
      location: initiative.location ? {
        latitude: initiative.location.coordinates[1],
        longitude: initiative.location.coordinates[0],
        address: `${initiative.location.coordinates[1].toFixed(4)}, ${initiative.location.coordinates[0].toFixed(4)}`
      } : null,
      author: initiative.author,
      created_at: initiative.created_at,
      updated_at: initiative.updated_at
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating green initiative:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid initiative data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create initiative' }, { status: 500 })
  }
}
