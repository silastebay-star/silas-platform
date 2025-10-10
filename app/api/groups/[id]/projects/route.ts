import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = createSupabaseServerClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('group_id', id)

  if (error) {
    handleServerError(error, `Failed to fetch projects for group ID: ${id}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(projects, { status: 200 })
}