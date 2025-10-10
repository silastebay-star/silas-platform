import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(['user_post', 'announcement']),
  images: z.array(z.string()).max(4).optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
  }).optional(),
  tags: z.array(z.string()).max(10).optional()
})

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')
  const filter = searchParams.get('filter') || 'all'
  const search = searchParams.get('search') || ''

  try {
    // Build the query for feed items
    let query = supabase
      .from('feed_items')
      .select(`
        id,
        type,
        content,
        created_at,
        updated_at,
        author:users!author_id(id, full_name, username, avatar_url, role),
        related_pin:pins(id, title, latitude, longitude),
        related_proposal:proposals(id, title, status),
        related_project:projects(id, title, status),
        related_group:groups(id, name, type),
        engagement:feed_engagement(
          likes_count,
          comments_count,
          shares_count,
          views_count
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (filter !== 'all') {
      switch (filter) {
        case 'pins':
          query = query.in('type', ['pin_created', 'pin_updated'])
          break
        case 'proposals':
          query = query.in('type', ['proposal_created', 'proposal_voted'])
          break
        case 'projects':
          query = query.in('type', ['project_milestone', 'project_created'])
          break
        case 'groups':
          query = query.eq('type', 'group_activity')
          break
      }
    }

    // Apply search
    if (search) {
      query = query.or(`content->>title.ilike.%${search}%,content->>description.ilike.%${search}%,content->>text.ilike.%${search}%`)
    }

    const { data: feedItems, error } = await query

    if (error) {
      console.error('Error fetching feed:', error)
      return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 })
    }

    // Get current user to check engagement status
    const { data: { user } } = await supabase.auth.getUser()
    
    // Fetch user engagement data if authenticated
    let userEngagements: any[] = []
    if (user && feedItems) {
      const { data: engagements } = await supabase
        .from('user_feed_engagement')
        .select('feed_item_id, liked, bookmarked')
        .eq('user_id', user.id)
        .in('feed_item_id', feedItems.map(item => item.id))
      
      userEngagements = engagements || []
    }

    // Process feed items
    const processedItems = feedItems?.map(item => {
      const userEngagement = userEngagements.find(e => e.feed_item_id === item.id)
      
      return {
        id: item.id,
        type: item.type,
        author: item.author,
        content: item.content,
        engagement: {
          likes: item.engagement?.likes_count || 0,
          comments: item.engagement?.comments_count || 0,
          shares: item.engagement?.shares_count || 0,
          views: item.engagement?.views_count || 0,
          user_liked: userEngagement?.liked || false,
          user_bookmarked: userEngagement?.bookmarked || false
        },
        related_items: {
          pin_id: item.related_pin?.id,
          proposal_id: item.related_proposal?.id,
          project_id: item.related_project?.id,
          group_id: item.related_group?.id
        },
        created_at: item.created_at,
        updated_at: item.updated_at
      }
    }) || []

    // Check if there are more items
    const { count } = await supabase
      .from('feed_items')
      .select('*', { count: 'exact', head: true })
    
    const hasMore = (offset + limit) < (count || 0)

    return NextResponse.json({
      items: processedItems,
      has_more: hasMore,
      total: count
    })

  } catch (error) {
    console.error('Error in feed API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const content = formData.get('content') as string
    const type = formData.get('type') as string || 'user_post'

    // Validate basic data
    const postData = createPostSchema.parse({
      content,
      type: type as any
    })

    // Handle image uploads
    const images: string[] = []
    for (let i = 0; i < 4; i++) {
      const image = formData.get(`image_${i}`) as File
      if (image && image.size > 0) {
        const fileName = `feed/${user.id}/${Date.now()}_${image.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('feed-images')
          .upload(fileName, image)

        if (uploadError) {
          console.error('Image upload error:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('feed-images')
            .getPublicUrl(fileName)
          images.push(publicUrl)
        }
      }
    }

    // Create feed item
    const feedContent = {
      text: content,
      images: images.length > 0 ? images : undefined
    }

    const { data: feedItem, error } = await supabase
      .from('feed_items')
      .insert([{
        type: postData.type,
        author_id: user.id,
        content: feedContent
      }])
      .select(`
        id,
        type,
        content,
        created_at,
        updated_at,
        author:users!author_id(id, full_name, username, avatar_url, role)
      `)
      .single()

    if (error) {
      console.error('Error creating feed item:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    // Initialize engagement record
    await supabase
      .from('feed_engagement')
      .insert([{
        feed_item_id: feedItem.id,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        views_count: 1
      }])
      .catch(err => console.error('Failed to create engagement record:', err))

    // Format response
    const response = {
      id: feedItem.id,
      type: feedItem.type,
      author: feedItem.author,
      content: feedItem.content,
      engagement: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 1,
        user_liked: false,
        user_bookmarked: false
      },
      related_items: {},
      created_at: feedItem.created_at,
      updated_at: feedItem.updated_at
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating post:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid post data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
