/**
 * Proposal Card Component
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  MoreHorizontal,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Edit,
  Trash2,
  Share2
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useVoting } from '../hooks/useVoting'
import { useFeedback } from '@/lib/user-feedback'
import type { Proposal } from '../types'

interface ProposalCardProps {
  proposal: Proposal
  onEdit?: (proposal: Proposal) => void
  onDelete?: (proposalId: string) => void
  onShare?: (proposal: Proposal) => void
  showActions?: boolean
  compact?: boolean
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  completed: 'bg-purple-100 text-purple-800'
}

const CATEGORY_ICONS = {
  infrastructure: '🏗️',
  community: '👥',
  environment: '🌱',
  education: '📚',
  health: '🏥',
  arts: '🎨',
  technology: '💻',
  emergency: '🚨'
}

export default function ProposalCard({
  proposal,
  onEdit,
  onDelete,
  onShare,
  showActions = true,
  compact = false
}: ProposalCardProps) {
  const [showFullDescription, setShowFullDescription] = useState(false)
  const { castVote, userVote, votingStats, loading: votingLoading } = useVoting(proposal.id)
  const feedback = useFeedback()

  const handleVote = async (voteType: 'for' | 'against' | 'abstain') => {
    try {
      await castVote({
        proposal_id: proposal.id,
        vote_type: voteType
      })
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      default: return 'secondary'
    }
  }

  const truncatedDescription = proposal.description.length > 150
    ? proposal.description.substring(0, 150) + '...'
    : proposal.description

  const approvalPercentage = proposal.total_votes > 0
    ? Math.round((proposal.votes_for / proposal.total_votes) * 100)
    : 0

  return (
    <Card className={cn(
      "hover:shadow-lg transition-shadow duration-200",
      compact && "p-4"
    )}>
      <CardHeader className={cn("pb-4", compact && "pb-2")}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">
                {CATEGORY_ICONS[proposal.category as keyof typeof CATEGORY_ICONS] || '📋'}
              </span>
              <Badge
                variant={getStatusBadgeVariant(proposal.status)}
                className={STATUS_COLORS[proposal.status as keyof typeof STATUS_COLORS]}
              >
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </Badge>
              {proposal.days_remaining !== null && proposal.days_remaining !== undefined && proposal.days_remaining <= 7 && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  {proposal.days_remaining}d left
                </Badge>
              )}
            </div>

            <CardTitle className={cn(
              "text-lg font-semibold leading-tight",
              compact && "text-base"
            )}>
              {proposal.title}
            </CardTitle>

            {proposal.pin_location && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin className="w-3 h-3" />
                {proposal.pin_location.title}
              </div>
            )}
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="">
                {onShare && (
                  <DropdownMenuItem onClick={() => onShare(proposal)} className="" inset={false}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(proposal)} className="" inset={false}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(proposal.id)}
                    className="text-red-600"
                    inset={false}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {!compact && (
          <CardDescription className="text-sm text-gray-600 leading-relaxed">
            {showFullDescription ? proposal.description : truncatedDescription}
            {proposal.description.length > 150 && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-silas-green hover:underline ml-1"
              >
                {showFullDescription ? 'Show less' : 'Show more'}
              </button>
            )}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className={cn("pt-0", compact && "pt-2")}>
        {/* Funding Information */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-silas-green">
              £{proposal.amount_requested.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600">Requested</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold">
              {proposal.total_votes}
            </div>
            <div className="text-xs text-gray-600">Total Votes</div>
          </div>
        </div>

        {/* Voting Progress */}
        {proposal.total_votes > 0 && (
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">
                {proposal.votes_for} for ({approvalPercentage}%)
              </span>
              <span className="text-red-600">
                {proposal.votes_against} against
              </span>
            </div>
            <Progress
              value={approvalPercentage}
              className="h-2"
            />
          </div>
        )}

        {/* Voting Actions */}
        {proposal.status === 'active' && (
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={userVote?.vote_type === 'for' ? 'default' : 'outline'}
              onClick={() => handleVote('for')}
              disabled={votingLoading}
              className="flex-1"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Support
            </Button>
            <Button
              size="sm"
              variant={userVote?.vote_type === 'against' ? 'destructive' : 'outline'}
              onClick={() => handleVote('against')}
              disabled={votingLoading}
              className="flex-1"
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              Oppose
            </Button>
            <Button
              size="sm"
              variant={userVote?.vote_type === 'abstain' ? 'secondary' : 'outline'}
              onClick={() => handleVote('abstain')}
              disabled={votingLoading}
              className=""
            >
              <Minus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {proposal.creator_profile && (
              <div className="flex items-center gap-1">
                <Avatar className="w-4 h-4">
                  <AvatarImage src={proposal.creator_profile.avatar_url} />
                  <AvatarFallback>
                    {proposal.creator_profile.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span>{proposal.creator_profile.name || 'Anonymous'}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(proposal.created_at), { addSuffix: true })}
            </div>
          </div>

          {proposal.voting_deadline && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Ends {format(new Date(proposal.voting_deadline), 'MMM d')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
