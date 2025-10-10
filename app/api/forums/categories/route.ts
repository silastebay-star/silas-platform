import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()

  try {
    const { data: categories, error } = await supabase
      .from('forum_categories')
      .select(`
        id,
        name,
        description,
        icon,
        color,
        is_locked,
        display_order,
        moderators,
        created_at,
        topic_count:forum_topics(count),
        post_count:forum_posts(count),
        last_activity:forum_topics(
          updated_at,
          author:users!author_id(full_name)
        )
      `)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching forum categories:', error)
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }

    // Process the data to get proper counts and last activity
    const processedCategories = categories?.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
      is_locked: category.is_locked,
      moderators: category.moderators || [],
      topic_count: category.topic_count?.[0]?.count || 0,
      post_count: category.post_count?.[0]?.count || 0,
      last_activity: category.last_activity?.[0]?.updated_at || category.created_at
    })) || []

    return NextResponse.json(processedCategories)

  } catch (error) {
    console.error('Error in forum categories API:', error)
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, icon, color } = body

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
    }

    // Get the next display order
    const { data: lastCategory } = await supabase
      .from('forum_categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastCategory?.display_order || 0) + 1

    const { data: category, error } = await supabase
      .from('forum_categories')
      .insert([{
        name,
        description,
        icon: icon || 'message-square',
        color: color || 'bg-blue-500',
        display_order: nextOrder,
        created_by: user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating forum category:', error)
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }

    return NextResponse.json(category, { status: 201 })

  } catch (error) {
    console.error('Error creating forum category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
