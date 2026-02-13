import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  
  const supabase = createSupabaseServerClient()

  try {
    const { id } = await params

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name') // Only select necessary fields
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (e) {
    console.error('Unexpected error fetching profile:', e)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
