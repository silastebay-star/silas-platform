import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  
  const timeframe = searchParams.get('timeframe') || '24h'
  const limit = parseInt(searchParams.get('limit') || '20')

  try {
    // Calculate time threshold
    const now = new Date()
    let timeThreshold = new Date()
    
    switch (timeframe) {
      case '1h':
        timeThreshold.setHours(now.getHours() - 1)
        break
      case '24h':
        timeThreshold.setDate(now.getDate() - 1)
        break
      case '7d':
        timeThreshold.setDate(now.getDate() - 7)
        break
      case '30d':
        timeThreshold.setDate(now.getDate() - 30)
        break
      default:
        timeThreshold.setDate(now.getDate() - 1)
    }

    // Get trending content from different sources
    const [pins, proposals, projects, posts] = await Promise.all([
      // Trending pins
      supabase
        .from('pins')
        .select(`
          id,
          title,
          description,
          created_at,
          author:users!created_by(id, full_name, username, avatar_url),
          engagement:pin_engagement(likes_count, comments_count, shares_count, views_count)
        `)
        .gte('created_at', timeThreshold.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit / 4),

      // Trending proposals
      supabase
        .from('proposals')
        .select(`
          id,
          title,
          description,
          created_at,
          author:users!proposer_id(id, full_name, username, avatar_url),
          votes_for,
          votes_against,
          votes_abstain
        `)
        .gte('created_at', timeThreshold.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit / 4),

      // Trending projects
      supabase
        .from('projects')
        .select(`
          id,
          title,
          description,
          created_at,
          author:users!created_by(id, full_name, username, avatar_url),
          engagement:project_engagement(likes_count, comments_count, shares_count, views_count)
        `)
        .gte('created_at', timeThreshold.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit / 4),

      // Trending posts
      supabase
        .from('feed_items')
        .select(`
          id,
          content,
          created_at,
          author:users!author_id(id, full_name, username, avatar_url),
          engagement:feed_engagement(likes_count, comments_count, shares_count, views_count)
        `)
        .gte('created_at', timeThreshold.toISOString())
        .eq('type', 'user_post')
        .order('created_at', { ascending: false })
        .limit(limit / 4)
    ])

    // Process and combine all content
    const trendingContent: any[] = []

    // Process pins
    if (pins.data) {
      pins.data.forEach(pin => {
        const engagement = pin.engagement?.[0] || { likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0 }
        const score = calculateTrendingScore(engagement, pin.created_at)
        
        trendingContent.push({
          id: pin.id,
          type: 'pin',
          title: pin.title,
          description: pin.description,
          author: pin.author,
          engagement: {
            likes: engagement.likes_count,
            comments: engagement.comments_count,
            shares: engagement.shares_count,
            views: engagement.views_count
          },
          created_at: pin.created_at,
          trending_score: score
        })
      })
    }

    // Process proposals
    if (proposals.data) {
      proposals.data.forEach(proposal => {
        const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain
        const engagement = { likes_count: totalVotes, comments_count: 0, shares_count: 0, views_count: totalVotes * 2 }
        const score = calculateTrendingScore(engagement, proposal.created_at)
        
        trendingContent.push({
          id: proposal.id,
          type: 'proposal',
          title: proposal.title,
          description: proposal.description,
          author: proposal.author,
          engagement: {
            likes: proposal.votes_for,
            comments: 0, // Would need to join with comments
            shares: 0,
            views: totalVotes * 2
          },
          created_at: proposal.created_at,
          trending_score: score
        })
      })
    }

    // Process projects
    if (projects.data) {
      projects.data.forEach(project => {
        const engagement = project.engagement?.[0] || { likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0 }
        const score = calculateTrendingScore(engagement, project.created_at)
        
        trendingContent.push({
          id: project.id,
          type: 'project',
          title: project.title,
          description: project.description,
          author: project.author,
          engagement: {
            likes: engagement.likes_count,
            comments: engagement.comments_count,
            shares: engagement.shares_count,
            views: engagement.views_count
          },
          created_at: project.created_at,
          trending_score: score
        })
      })
    }

    // Process posts
    if (posts.data) {
      posts.data.forEach(post => {
        const engagement = post.engagement?.[0] || { likes_count: 0, comments_count: 0, shares_count: 0, views_count: 0 }
        const score = calculateTrendingScore(engagement, post.created_at)
        
        trendingContent.push({
          id: post.id,
          type: 'post',
          title: post.content?.title || 'User Post',
          description: post.content?.text || post.content?.description,
          author: post.author,
          engagement: {
            likes: engagement.likes_count,
            comments: engagement.comments_count,
            shares: engagement.shares_count,
            views: engagement.views_count
          },
          created_at: post.created_at,
          trending_score: score
        })
      })
    }

    // Sort by trending score and limit results
    const sortedContent = trendingContent
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit)

    return NextResponse.json(sortedContent)

  } catch (error) {
    console.error('Error fetching trending content:', error)
    return NextResponse.json({ error: 'Failed to fetch trending content' }, { status: 500 })
  }
}

// Calculate trending score based on engagement and recency
function calculateTrendingScore(engagement: any, createdAt: string): number {
  const now = new Date().getTime()
  const created = new Date(createdAt).getTime()
  const ageInHours = (now - created) / (1000 * 60 * 60)
  
  // Engagement score
  const likes = engagement.likes_count || 0
  const comments = engagement.comments_count || 0
  const shares = engagement.shares_count || 0
  const views = engagement.views_count || 0
  
  // Weighted engagement score
  const engagementScore = (likes * 3) + (comments * 5) + (shares * 7) + (views * 0.1)
  
  // Time decay factor (content loses relevance over time)
  const timeDecay = Math.max(0.1, 1 / (1 + ageInHours / 24))
  
  // Final trending score
  return engagementScore * timeDecay
}
