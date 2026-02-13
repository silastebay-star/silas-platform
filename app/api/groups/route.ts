import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'
import { z } from 'zod'
import { createGroupRateLimiter } from '@/lib/rate-limiter'

// Define schema for group creation
const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100, 'Group name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
})

export async function GET() {
  const supabase = createSupabaseServerClient()

  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')

  if (error) {
    handleServerError(error, 'Failed to fetch groups')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(groups, { status: 200 })
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Apply rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
  const { allowed, remaining, reset } = createGroupRateLimiter(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: reset - Date.now() },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
    )
  }

  try {
    const body = await request.json()
    const { name, description } = createGroupSchema.parse(body)

    const { data, error } = await supabase
      .from('groups')
      .insert([
        { name, description, owner_id: user.id },
      ])
      .select()

    if (error) {
      handleServerError(error, 'Failed to create group')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0], { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    handleServerError(error, 'Error creating group')
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}