import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const followSchema = z.object({
  user_id: z.string().uuid()
})

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id: targetUserId } = followSchema.parse(body)

    // Can't follow yourself
    if (targetUserId === user.id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', targetUserId)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already following
    const { data: existingFollow, error: followError } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followed_id', targetUserId)
      .single()

    if (followError && followError.code !== 'PGRST116') {
      console.error('Error checking existing follow:', followError)
      return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 })
    }

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 })
    }

    // Create follow relationship
    const { error: insertError } = await supabase
      .from('user_follows')
      .insert([{
        follower_id: user.id,
        followed_id: targetUserId
      }])

    if (insertError) {
      console.error('Error creating follow relationship:', insertError)
      return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
    }

    // Create notification for followed user
    await supabase
      .from('notifications')
      .insert([{
        user_id: targetUserId,
        type: 'new_follower',
        title: 'New Follower',
        message: `${user.email} started following you`,
        data: {
          follower_id: user.id
        }
      }])
      .catch(err => console.error('Failed to create notification:', err))

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: 'followed_user',
        target_type: 'user',
        target_id: targetUserId
      }])
      .catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error following user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to follow user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id: targetUserId } = followSchema.parse(body)

    // Remove follow relationship
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('followed_id', targetUserId)

    if (error) {
      console.error('Error unfollowing user:', error)
      return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: 'unfollowed_user',
        target_type: 'user',
        target_id: targetUserId
      }])
      .catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error unfollowing user:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to unfollow user' }, { status: 500 })
  }
}
