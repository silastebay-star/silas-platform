import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'
import { z } from 'zod'
import { createProjectRateLimiter } from '@/lib/rate-limiter'

// Define schema for project creation
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  group_id: z.string().uuid('Invalid group ID format').nullable().optional(),
  pin_ids: z.array(z.string().uuid('Invalid pin ID format')).optional(),
})

export async function GET() {
  
  const supabase = createSupabaseServerClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')

  if (error) {
    handleServerError(error, 'Failed to fetch projects')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(projects, { status: 200 })
}

export async function POST(request: Request) {
  
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Apply rate limiting
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
  const { allowed, remaining, reset } = createProjectRateLimiter(ip)

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: reset - Date.now() },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
    )
  }

  try {
    const body = await request.json()
    const { name, description, group_id, pin_ids } = createProjectSchema.parse(body)

    // 1. Create the project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([
        { name, description, group_id, owner_id: user.id, status: 'proposed' }, // Assuming 'owner_id' and 'status' defaults
      ])
      .select()
      .single()

    if (projectError) {
      handleServerError(projectError, 'Error creating project')
      return NextResponse.json({ error: projectError.message }, { status: 500 })
    }

    // 2. Link pins to the new project if pin_ids are provided
    if (pin_ids && pin_ids.length > 0) {
      const { error: pinUpdateError } = await supabase
        .from('pins')
        .update({ project_id: project.id })
        .in('id', pin_ids)

      if (pinUpdateError) {
        handleServerError(pinUpdateError, `Error linking pins to project ${project.id}`)
        // Decide whether to roll back project creation or just log the error
        // For now, we'll just log and proceed, as project is still valid without pins
      }
    }

    return NextResponse.json(project, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    handleServerError(error, 'Error creating project')
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
