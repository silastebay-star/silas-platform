import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { handleServerError } from '@/lib/server-error-handling'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = await params
  const supabase = createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user is already a member
  const { data: existingMember, error: fetchError } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .eq('profile_id', user.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    handleServerError(fetchError, `Error checking existing membership for group ID: ${groupId}`)
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (existingMember) {
    return NextResponse.json({ message: 'Already a member' }, { status: 200 })
  }

  const { data, error } = await supabase
    .from('group_members')
    .insert([
      { group_id: groupId, profile_id: user.id, role: 'member' },
    ])
    .select()

  if (error) {
    handleServerError(error, `Error joining group ID: ${groupId}`)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data[0], { status: 201 })
}