
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import admin from '@/lib/firebase/admin'

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()
  const { title, message } = await request.json()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if the user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Insert the security alert into the database
  const { data: alert, error: alertError } = await supabase
    .from('security_alerts')
    .insert([{ title, message, author_id: user.id }])
    .select()

  if (alertError) {
    return NextResponse.json({ error: alertError.message }, { status: 500 })
  }

  // Get all device tokens from the profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('device_tokens')

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  const deviceTokens = profiles.flatMap(p => p.device_tokens).filter(Boolean)

  if (deviceTokens.length > 0) {
    // Send push notifications
    const messagePayload = {
      notification: {
        title,
        body: message,
      },
      tokens: deviceTokens,
    }

    try {
      await admin.messaging().sendEachForMulticast(messagePayload)
    } catch (error) {
      console.error('Error sending push notifications', error)
    }
  }

  return NextResponse.json(alert)
}
