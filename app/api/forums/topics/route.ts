import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createTopicSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  category_id: z.string().uuid(),
  tags: z.array(z.string()).max(10).optional()
})

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  const categoryId = searchParams.get('category_id')
  const search = searchParams.get('search') || ''
  const sort = searchParams.get('sort') || 'recent'
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    let query = supabase
      .from('forum_topics')
      .select(`
        id,
        title,
        description,
        category_id,
        is_pinned,
        is_locked,
        is_solved,
        tags,
        created_at,
        updated_at,
        author:users!author_id(id, full_name, username, avatar_url, role),
        reply_count:forum_posts(count),
        view_count,
        last_reply:forum_posts(
          created_at,
          author:users!author_id(full_name)
        )
      `)
      .range(offset, offset + limit - 1)

    // Filter by category
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    // Search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Sorting
    switch (sort) {
      case 'popular':
        query = query.order('view_count', { ascending: false })
        break
      case 'solved':
        query = query.eq('is_solved', true).order('updated_at', { ascending: false })
        break
      default: // recent
        query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false })
    }

    const { data: topics, error } = await query

    if (error) {
      console.error('Error fetching forum topics:', error)
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 })
    }

    // Process the data
    const processedTopics = topics?.map(topic => ({
      id: topic.id,
      title: topic.title,
      description: topic.description,
      category_id: topic.category_id,
      author: topic.author,
      is_pinned: topic.is_pinned,
      is_locked: topic.is_locked,
      is_solved: topic.is_solved,
      reply_count: topic.reply_count?.[0]?.count || 0,
      view_count: topic.view_count || 0,
      last_reply: topic.last_reply?.[0] ? {
        author: topic.last_reply[0].author.full_name,
        created_at: topic.last_reply[0].created_at
      } : null,
      tags: topic.tags || [],
      created_at: topic.created_at,
      updated_at: topic.updated_at
    })) || []

    return NextResponse.json(processedTopics)

  } catch (error) {
    console.error('Error in forum topics API:', error)
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

    const body = await request.json()
    const { title, content, category_id, tags } = createTopicSchema.parse(body)

    // Verify category exists and is not locked
    const { data: category, error: categoryError } = await supabase
      .from('forum_categories')
      .select('id, is_locked')
      .eq('id', category_id)
      .single()

    if (categoryError) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (category.is_locked) {
      return NextResponse.json({ error: 'Category is locked' }, { status: 403 })
    }

    // Create topic
    const { data: topic, error } = await supabase
      .from('forum_topics')
      .insert([{
        title,
        description: content,
        category_id,
        author_id: user.id,
        tags: tags || [],
        view_count: 1
      }])
      .select(`
        id,
        title,
        description,
        category_id,
        is_pinned,
        is_locked,
        is_solved,
        tags,
        created_at,
        updated_at,
        author:users!author_id(id, full_name, username, avatar_url, role)
      `)
      .single()

    if (error) {
      console.error('Error creating forum topic:', error)
      return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
    }

    // Create the initial post
    const { error: postError } = await supabase
      .from('forum_posts')
      .insert([{
        topic_id: topic.id,
        content,
        author_id: user.id,
        is_original_post: true
      }])

    if (postError) {
      console.error('Error creating initial post:', postError)
      // Clean up the topic if post creation fails
      await supabase.from('forum_topics').delete().eq('id', topic.id)
      return NextResponse.json({ error: 'Failed to create topic post' }, { status: 500 })
    }

    // Log activity
    await supabase
      .from('activity_log')
      .insert([{
        user_id: user.id,
        action: 'created_forum_topic',
        target_type: 'forum_topic',
        target_id: topic.id,
        metadata: { category_id, title }
      }])
      .catch(err => console.error('Failed to log activity:', err))

    // Format response
    const response = {
      ...topic,
      reply_count: 0,
      view_count: 1,
      last_reply: null
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating forum topic:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid topic data', 
        details: error.errors 
      }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 })
  }
}
