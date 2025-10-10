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

    // Check if user has already bookmarked this item
    const { data: existingBookmark, error: checkError } = await supabase
      .from('user_feed_engagement')
      .select('bookmarked, liked')
      .eq('user_id', user.id)
      .eq('feed_item_id', feedItemId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing bookmark:', checkError)
      return NextResponse.json({ error: 'Failed to check bookmark status' }, { status: 500 })
    }

    const isCurrentlyBookmarked = existingBookmark?.bookmarked || false
    const newBookmarkedStatus = !isCurrentlyBookmarked

    // Update or insert user engagement
    const { error: upsertError } = await supabase
      .from('user_feed_engagement')
      .upsert({
        user_id: user.id,
        feed_item_id: feedItemId,
        bookmarked: newBookmarkedStatus,
        liked: existingBookmark?.liked || false
      })

    if (upsertError) {
      console.error('Error updating user engagement:', upsertError)
      return NextResponse.json({ error: 'Failed to update bookmark status' }, { status: 500 })
    }

    // Create activity log entry
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: newBookmarkedStatus ? 'bookmarked_feed_item' : 'unbookmarked_feed_item',
        target_type: 'feed_item',
        target_id: feedItemId
      }])
      .catch(err => console.error('Failed to log activity:', err))

    return NextResponse.json({
      bookmarked: newBookmarkedStatus
    })

  } catch (error) {
    console.error('Error processing bookmark:', error)
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

    // Remove bookmark
    const { error: deleteError } = await supabase
      .from('user_feed_engagement')
      .update({ bookmarked: false })
      .eq('user_id', user.id)
      .eq('feed_item_id', feedItemId)

    if (deleteError) {
      console.error('Error removing bookmark:', deleteError)
      return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error removing bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
