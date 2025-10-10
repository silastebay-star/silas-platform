import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1).max(10000)
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id: topicId } = await params

  try {
    // Increment view count
    await supabase
      .from('forum_topics')
      .update({ view_count: supabase.raw('view_count + 1') })
      .eq('id', topicId)
      .catch(err => console.error('Failed to increment view count:', err))

    // Fetch posts
    const { data: posts, error } = await supabase
      .from('forum_posts')
      .select(`
        id,
        content,
        topic_id,
        is_solution,
        is_original_post,
        created_at,
        updated_at,
        is_edited,
        author:users!author_id(
          id,
          full_name,
          username,
          avatar_url,
          role,
          post_count:forum_posts(count),
          reputation
        ),
        likes:post_reactions(count)
      `)
      .eq('topic_id', topicId)
      .order('is_original_post', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching forum posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Get current user to check their reactions
    const { data: { user } } = await supabase.auth.getUser()
    let userReactions: any[] = []
    
    if (user && posts) {
      const { data: reactions } = await supabase
        .from('user_post_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', posts.map(p => p.id))
      
      userReactions = reactions || []
    }

    // Process posts
    const processedPosts = posts?.map(post => {
      const userReaction = userReactions.find(r => r.post_id === post.id)
      
      return {
        id: post.id,
        content: post.content,
        topic_id: post.topic_id,
        author: {
          ...post.author,
          post_count: post.author.post_count?.[0]?.count || 0
        },
        is_solution: post.is_solution,
        is_original_post: post.is_original_post,
        likes: post.likes?.[0]?.count || 0,
        user_liked: userReaction?.reaction_type === 'like',
        created_at: post.created_at,
        updated_at: post.updated_at,
        is_edited: post.is_edited
      }
    }) || []

    return NextResponse.json(processedPosts)

  } catch (error) {
    console.error('Error in forum posts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient()
  const { id: topicId } = await params

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = createPostSchema.parse(body)

    // Verify topic exists and is not locked
    const { data: topic, error: topicError } = await supabase
      .from('forum_topics')
      .select('id, is_locked, category_id')
      .eq('id', topicId)
      .single()

    if (topicError) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    if (topic.is_locked) {
      return NextResponse.json({ error: 'Topic is locked' }, { status: 403 })
    }

    // Create post
    const { data: post, error } = await supabase
      .from('forum_posts')
      .insert([{
        topic_id: topicId,
        content,
        author_id: user.id
      }])
      .select(`
        id,
        content,
        topic_id,
        is_solution,
        is_original_post,
        created_at,
        updated_at,
        is_edited,
        author:users!author_id(
          id,
          full_name,
          username,
          avatar_url,
          role,
          reputation
        )
      `)
      .single()

    if (error) {
      console.error('Error creating forum post:', error)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    // Update topic's updated_at timestamp
    await supabase
      .from('forum_topics')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', topicId)
      .catch(err => console.error('Failed to update topic timestamp:', err))

    // Initialize reaction count
    await supabase
      .from('post_reactions')
      .insert([{
        post_id: post.id,
        reaction_type: 'likes',
        count: 0
      }])
      .catch(err => console.error('Failed to initialize reaction count:', err))

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: 'created_forum_post',
        target_type: 'forum_post',
        target_id: post.id,
        metadata: { topic_id: topicId, category_id: topic.category_id }
      }])
      .catch(err => console.error('Failed to log activity:', err))

    // Format response
    const response = {
      ...post,
      author: {
        ...post.author,
        post_count: 1 // This would need to be calculated properly
      },
      likes: 0,
      user_liked: false
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating forum post:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid post data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
