/**
 * Fund Metrics Chart Component
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target,
  Calendar,
  BarChart3
} from 'lucide-react'
import type { FundBalance, FundMetrics, Proposal } from '../types'

interface FundMetricsChartProps {
  balance: FundBalance | null
  metrics: FundMetrics | null
  proposals: Proposal[]
  className?: string
}

export default function FundMetricsChart({ 
  balance, 
  metrics, 
  proposals,
  className = ""
}: FundMetricsChartProps) {
  if (!balance || !metrics) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate category distribution
  const categoryStats = proposals.reduce((acc, proposal) => {
    acc[proposal.category] = (acc[proposal.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalProposals = proposals.length
  const categoryData = Object.entries(categoryStats).map(([category, count]) => ({
    category,
    count,
    percentage: totalProposals > 0 ? (count / totalProposals) * 100 : 0
  }))

  // Calculate monthly trends (mock data for now)
  const monthlyData = [
    { month: 'Jan', contributions: 2500, proposals: 3 },
    { month: 'Feb', contributions: 3200, proposals: 5 },
    { month: 'Mar', contributions: 2800, proposals: 4 },
    { month: 'Apr', contributions: 4100, proposals: 7 },
    { month: 'May', contributions: 3600, proposals: 6 },
    { month: 'Jun', contributions: balance.monthly_contributions, proposals: proposals.filter(p => 
      new Date(p.created_at).getMonth() === new Date().getMonth()
    ).length }
  ]

  const fundingEfficiency = balance.total_balance > 0 
    ? (metrics.total_funding_approved / balance.total_balance) * 100 
    : 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Funding Trends */}
      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Funding Trends
          </CardTitle>
          <CardDescription className="">
            Monthly contribution and proposal activity
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium w-8">{data.month}</div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm">£{data.contributions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">{data.proposals} proposals</span>
                  </div>
                </div>
                <div className="w-24">
                  <Progress 
                    value={(data.contributions / 5000) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Proposal Categories
          </CardTitle>
          <CardDescription className="">
            Distribution of proposals by category
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="space-y-3">
            {categoryData.map((item) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="">
                    {item.category}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {item.count} proposal{item.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fund Performance */}
      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Fund Performance
          </CardTitle>
          <CardDescription className="">
            Key performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Success Rate</span>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {metrics.success_rate.toFixed(0)}%
              </div>
              <div className="text-xs text-green-700">
                {metrics.approved_proposals} of {metrics.total_proposals} approved
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Funding Efficiency</span>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {fundingEfficiency.toFixed(0)}%
              </div>
              <div className="text-xs text-blue-700">
                Of total fund deployed
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Avg. Proposal</span>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">
                £{metrics.average_proposal_amount.toFixed(0)}
              </div>
              <div className="text-xs text-purple-700">
                Average request amount
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Participation</span>
                <Users className="h-4 w-4 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.community_participation}
              </div>
              <div className="text-xs text-orange-700">
                Active community members
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription className="">
            Latest fund activity and milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="space-y-3">
            {proposals.slice(0, 5).map((proposal) => (
              <div key={proposal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    proposal.status === 'active' ? 'bg-blue-500' :
                    proposal.status === 'approved' ? 'bg-green-500' :
                    proposal.status === 'rejected' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`} />
                  <div>
                    <div className="text-sm font-medium">{proposal.title}</div>
                    <div className="text-xs text-gray-600">
                      £{proposal.amount_requested.toLocaleString()} • {proposal.total_votes} votes
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={proposal.status === 'active' ? 'default' : 'secondary'}
                  className=""
                >
                  {proposal.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
