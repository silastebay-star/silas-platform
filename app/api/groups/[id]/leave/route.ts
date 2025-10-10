import { createSupabaseServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('profile_id', user.id)

  if (error) {
    handleServerError(error, `Error leaving group ID: ${groupId}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Successfully left group' }, { status: 200 })
}