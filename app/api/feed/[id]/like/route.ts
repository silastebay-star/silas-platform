import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id: feedItemId } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has already liked this item
    const { data: existingLike, error: checkError } = await supabase
      .from('user_feed_engagement')
      .select('liked')
      .eq('user_id', user.id)
      .eq('feed_item_id', feedItemId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing like:', checkError)
      return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 })
    }

    const isCurrentlyLiked = existingLike?.liked || false
    const newLikedStatus = !isCurrentlyLiked

    // Update or insert user engagement
    const { error: upsertError } = await supabase
      .from('user_feed_engagement')
      .upsert({
        user_id: user.id,
        feed_item_id: feedItemId,
        liked: newLikedStatus,
        bookmarked: existingLike?.bookmarked || false
      })

    if (upsertError) {
      console.error('Error updating user engagement:', upsertError)
      return NextResponse.json({ error: 'Failed to update like status' }, { status: 500 })
    }

    // Update the feed engagement counts
    const { data: currentEngagement, error: engagementError } = await supabase
      .from('feed_engagement')
      .select('likes_count')
      .eq('feed_item_id', feedItemId)
      .single()

    if (engagementError) {
      console.error('Error fetching engagement:', engagementError)
      return NextResponse.json({ error: 'Failed to fetch engagement data' }, { status: 500 })
    }

    const newLikesCount = newLikedStatus 
      ? (currentEngagement.likes_count + 1)
      : Math.max(0, currentEngagement.likes_count - 1)

    const { error: updateError } = await supabase
      .from('feed_engagement')
      .update({ likes_count: newLikesCount })
      .eq('feed_item_id', feedItemId)

    if (updateError) {
      console.error('Error updating engagement count:', updateError)
      return NextResponse.json({ error: 'Failed to update engagement count' }, { status: 500 })
    }

    // Create activity log entry
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: newLikedStatus ? 'liked_feed_item' : 'unliked_feed_item',
        target_type: 'feed_item',
        target_id: feedItemId,
        metadata: { likes_count: newLikesCount }
      }])
      .catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({
      liked: newLikedStatus,
      likes_count: newLikesCount
    })

  } catch (error) {
    console.error('Error processing like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id: feedItemId } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Remove like
    const { error: deleteError } = await supabase
      .from('user_feed_engagement')
      .update({ liked: false })
      .eq('user_id', user.id)
      .eq('feed_item_id', feedItemId)

    if (deleteError) {
      console.error('Error removing like:', deleteError)
      return NextResponse.json({ error: 'Failed to remove like' }, { status: 500 })
    }

    // Update engagement count
    const { data: currentEngagement } = await supabase
      .from('feed_engagement')
      .select('likes_count')
      .eq('feed_item_id', feedItemId)
      .single()

    if (currentEngagement) {
      const newLikesCount = Math.max(0, currentEngagement.likes_count - 1)
      
      await supabase
        .from('feed_engagement')
        .update({ likes_count: newLikesCount })
        .eq('feed_item_id', feedItemId)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing like:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
