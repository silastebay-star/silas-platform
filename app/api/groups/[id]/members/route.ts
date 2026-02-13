import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = createSupabaseServerClient()

  const { data: members, error } = await supabase
    .from('group_members')
    .select(`
      role,
      profiles ( display_name )
    `)
    .eq('group_id', id)

  if (error) {
    handleServerError(error, `Failed to fetch members for group ID: ${id}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(members, { status: 200 })
}