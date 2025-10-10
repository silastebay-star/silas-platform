import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const trackingSchema = z.object({
  table: z.enum(['page_views', 'user_events', 'performance_metrics', 'error_logs']),
  data: z.record(z.any())
})

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const body = await request.json()
    const { table, data } = trackingSchema.parse(body)

    // Add server-side metadata
    const enrichedData = {
      ...data,
      server_timestamp: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    }

    // Insert into appropriate table
    const { error } = await supabase
      .from(table)
      .insert([enrichedData])

    if (error) {
      console.error('Analytics tracking error:', error)
      return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
