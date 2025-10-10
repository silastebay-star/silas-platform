import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const { title, description, type, location } = await request.json()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const { data: newReport, error } = await supabase
      .from('crime_reports')
      .insert({
        title: title,
        description: description,
        type: type,
        location: location,
        reporter_id: user.id,
        status: 'reported', // All new reports start as reported
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating crime report:', error)
      return NextResponse.json({ error: 'Failed to create crime report' }, { status: 500 })
    }

    return NextResponse.json(newReport, { status: 201 })
  } catch (e) {
    console.error('Unexpected error creating crime report:', e)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
