import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = createSupabaseServerClient()

  const { data: milestones, error } = await supabase
    .from('milestones')
    .select('id, description, status')
    .eq('project_id', id)

  if (error) {
    handleServerError(error, `Failed to fetch milestones for project ID: ${id}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(milestones, { status: 200 })
}