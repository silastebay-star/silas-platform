import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  const type = searchParams.get('type') || 'all'
  const search = searchParams.get('search') || ''
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        username,
        avatar_url,
        role,
        bio,
        location,
        created_at,
        follower_count:user_follows!followed_id(count),
        following_count:user_follows!follower_id(count),
        post_count:feed_items!author_id(count),
        reputation,
        badges,
        interests
      `)
      .range(offset, offset + limit - 1)

    // Exclude current user from suggestions
    if (user && type === 'suggested') {
      query = query.neq('id', user.id)
    }

    // Search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    // Type-specific filtering
    switch (type) {
      case 'suggested':
        // For suggested users, we could implement more sophisticated logic
        // For now, just get users with high activity
        query = query.order('reputation', { ascending: false })
        break
      case 'active':
        query = query.order('created_at', { ascending: false })
        break
      default:
        query = query.order('full_name', { ascending: true })
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get follow relationships if user is authenticated
    let followRelationships: any[] = []
    if (user && users) {
      const { data: follows } = await supabase
        .from('user_follows')
        .select('followed_id, follower_id')
        .or(`follower_id.eq.${user.id},followed_id.eq.${user.id}`)
        .in('followed_id', users.map(u => u.id))
        .in('follower_id', [user.id, ...users.map(u => u.id)])

      followRelationships = follows || []
    }

    // Process users data
    const processedUsers = users?.map(userData => {
      const isFollowing = user ? followRelationships.some(
        f => f.follower_id === user.id && f.followed_id === userData.id
      ) : false
      
      const isFollowedBy = user ? followRelationships.some(
        f => f.followed_id === user.id && f.follower_id === userData.id
      ) : false

      return {
        id: userData.id,
        full_name: userData.full_name,
        username: userData.username,
        avatar_url: userData.avatar_url,
        role: userData.role,
        bio: userData.bio,
        location: userData.location,
        joined_at: userData.created_at,
        follower_count: userData.follower_count?.[0]?.count || 0,
        following_count: userData.following_count?.[0]?.count || 0,
        post_count: userData.post_count?.[0]?.count || 0,
        reputation: userData.reputation || 0,
        is_following: isFollowing,
        is_followed_by: isFollowedBy,
        badges: userData.badges || [],
        interests: userData.interests || []
      }
    }) || []

    return NextResponse.json(processedUsers)

  } catch (error) {
    console.error('Error in social users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
