import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createSupabaseServerClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()

    // Get community-wide statistics
    const [
      pinsCount,
      proposalsCount,
      projectsCount,
      membersCount,
      recentActivityCount,
      userEngagement
    ] = await Promise.all([
      // Total pins
      supabase
        .from('pins')
        .select('*', { count: 'exact', head: true }),

      // Active proposals
      supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      // Ongoing projects
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'in_progress']),

      // Community members
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true }),

      // Recent activity (last 24 hours)
      supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

      // User engagement score (if authenticated)
      user ? supabase
        .from('users')
        .select('reputation')
        .eq('id', user.id)
        .single() : Promise.resolve({ data: { reputation: 0 } })
    ])

    const stats = {
      total_pins: pinsCount.count || 0,
      active_proposals: proposalsCount.count || 0,
      ongoing_projects: projectsCount.count || 0,
      community_members: membersCount.count || 0,
      recent_activity: recentActivityCount.count || 0,
      user_engagement_score: userEngagement.data?.reputation || 0
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
