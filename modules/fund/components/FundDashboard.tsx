/**
 * Community Fund Dashboard Component
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  PlusCircle,
  TrendingUp,
  Users,
  DollarSign,
  Search,
  Filter,
  BarChart3,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react'
import { useFundBalance } from '../hooks/useFundBalance'
import { useProposals } from '../hooks/useProposals'
import CreateProposalModal from './CreateProposalModal'
import ProposalCard from './ProposalCard'
import FundMetricsChart from './FundMetricsChart'
import type { ProposalFilters } from '../types'

interface FundDashboardProps {
  pinId?: string // Optional pin ID for creating location-based proposals
  pinLocation?: {
    title: string
    address?: string
  }
}

export default function FundDashboard({ pinId, pinLocation }: FundDashboardProps = {}) {
  const [filters, setFilters] = useState<ProposalFilters>({
    status: undefined,
    category: undefined,
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { balance, metrics, loading: balanceLoading } = useFundBalance()
  const { proposals, loading: proposalsLoading, totalCount } = useProposals(filters)

  if (balanceLoading || proposalsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green"></div>
      </div>
    )
  }

  const activeProposals = proposals?.filter(p => p.status === 'active') || []
  const approvedProposals = proposals?.filter(p => p.status === 'approved') || []
  const completedProposals = proposals?.filter(p => p.status === 'completed') || []

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleStatusFilter = (status: string) => {
    if (status === 'all') {
      setFilters(prev => ({ ...prev, status: undefined }))
    } else {
      setFilters(prev => ({ ...prev, status: [status as any] }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Fund Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fund Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl font-bold text-silas-green">
              £{balance?.total_balance?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              £{balance?.available_balance?.toLocaleString() || '0'} available
            </p>
            {balance?.growth_rate && (
              <div className="flex items-center text-xs text-green-600 mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{balance.growth_rate.toFixed(1)}% growth
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl font-bold">{activeProposals.length}</div>
            <p className="text-xs text-muted-foreground">
              Seeking £{activeProposals.reduce((sum, p) => sum + p.amount_requested, 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl font-bold">
              {metrics?.success_rate ? `${metrics.success_rate.toFixed(0)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {approvedProposals.length} of {metrics?.total_proposals || 0} approved
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Participation</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="">
            <div className="text-2xl font-bold">
              {metrics?.community_participation || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active community members
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fund Health Indicator */}
      {balance && (
        <Card className="">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Fund Health
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Available Funding</div>
                <Progress
                  value={(balance.available_balance / balance.total_balance) * 100}
                  className="h-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {((balance.available_balance / balance.total_balance) * 100).toFixed(0)}% available
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Monthly Growth</div>
                <div className="text-lg font-bold text-green-600">
                  +£{balance.monthly_contributions?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Per month average</div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Projected 6M</div>
                <div className="text-lg font-bold">
                  £{balance.projected_balance?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-gray-500">Estimated balance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select onValueChange={handleStatusFilter} defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="default"
                size="default"
                onClick={() => setShowCreateModal(true)}
                className="bg-silas-green hover:bg-silas-green/90"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Proposal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fund Analytics */}
      <FundMetricsChart
        balance={balance}
        metrics={metrics}
        proposals={proposals || []}
      />

      {/* Proposals */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="">
          <TabsTrigger value="active" className="">
            Active ({activeProposals.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="">
            Approved ({approvedProposals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="">
            Completed ({completedProposals.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="">
            All ({totalCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeProposals.length === 0 ? (
            <Card className="">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Active Proposals</h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to create a proposal for community funding!
                  </p>
                  <Button
                    variant="default"
                    size="default"
                    className=""
                    onClick={() => setShowCreateModal(true)}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create First Proposal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeProposals.map(proposal => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onShare={(proposal) => {
                    // Implement sharing functionality
                    navigator.clipboard.writeText(`${window.location.origin}/fund?proposal=${proposal.id}`)
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <div className="grid gap-4">
            {approvedProposals.map(proposal => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {completedProposals.map(proposal => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {proposals?.map(proposal => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        pinId={pinId}
        pinLocation={pinLocation}
      />
    </div>
  )
}
