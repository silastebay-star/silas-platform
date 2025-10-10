import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const supabase = createSupabaseServerClient()

  const { data: group, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    handleServerError(error, `Failed to fetch group with ID: ${id}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  return NextResponse.json(group, { status: 200 })
}