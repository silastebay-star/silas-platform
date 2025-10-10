'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react'
import { format, isAfter } from 'date-fns'
import { cn } from '@/lib/utils'

interface Proposal {
  id: string
  title: string
  description: string
  category: string
  action: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'pending' | 'active' | 'approved' | 'rejected' | 'expired'
  voting_deadline: string
  voting_config: {
    requires_quorum: boolean
    quorum_percentage?: number
    allow_abstain: boolean
    is_anonymous: boolean
  }
  votes_for: number
  votes_against: number
  votes_abstain: number
  total_votes: number
  proposer: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
  }
  created_at: string
}

interface UserVote {
  vote: 'yes' | 'no' | 'abstain'
  comment?: string
  created_at: string
}

interface VotingEngineProps {
  proposal: Proposal
  userVote?: UserVote
  onVoteSuccess?: () => void
  className?: string
}

export function VotingEngine({ proposal, userVote, onVoteSuccess, className }: VotingEngineProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedVote, setSelectedVote] = useState<'yes' | 'no' | 'abstain' | null>(userVote?.vote || null)
  const [voteComment, setVoteComment] = useState(userVote?.comment || '')
  const [showComment, setShowComment] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isVotingClosed = isAfter(new Date(), new Date(proposal.voting_deadline))
  const hasVoted = !!userVote
  const canVote = !isVotingClosed && !hasVoted && proposal.status === 'active'

  const totalVotes = proposal.votes_for + proposal.votes_against + proposal.votes_abstain
  const yesPercentage = totalVotes > 0 ? (proposal.votes_for / totalVotes) * 100 : 0
  const noPercentage = totalVotes > 0 ? (proposal.votes_against / totalVotes) * 100 : 0
  const abstainPercentage = totalVotes > 0 ? (proposal.votes_abstain / totalVotes) * 100 : 0

  // Calculate quorum status
  const requiredVotes = proposal.voting_config.requires_quorum
    ? Math.ceil((proposal.voting_config.quorum_percentage || 25) / 100 * 100) // Assuming 100 eligible voters
    : 0
  const quorumMet = totalVotes >= requiredVotes

  const handleVote = async (vote: 'yes' | 'no' | 'abstain') => {
    if (!canVote) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposal.id,
          vote,
          comment: voteComment.trim() || undefined
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cast vote')
      }

      setSelectedVote(vote)
      onVoteSuccess?.()

    } catch (error) {
      console.error('Voting error:', error)
      setError(error instanceof Error ? error.message : 'Failed to cast vote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'normal': return 'bg-blue-500'
      case 'low': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'approved': return 'bg-green-600'
      case 'rejected': return 'bg-red-500'
      case 'expired': return 'bg-gray-500'
      default: return 'bg-yellow-500'
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-xl">{proposal.title}</CardTitle>
              <Badge className={getPriorityColor(proposal.priority)}>
                {proposal.priority}
              </Badge>
              <Badge className={getStatusColor(proposal.status)}>
                {proposal.status}
              </Badge>
            </div>
            <CardDescription className="text-sm">
              Proposed by {proposal.proposer.full_name} • {format(new Date(proposal.created_at), 'PPP')}
            </CardDescription>
          </div>

          <div className="text-right text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>
                {isVotingClosed ? 'Voting closed' : 'Voting ends'} {format(new Date(proposal.voting_deadline), 'PPp')}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Voting Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Voting Results</span>
            </h3>
            <span className="text-sm text-gray-600">
              {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast
            </span>
          </div>

          <div className="space-y-3">
            {/* Yes votes */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <ThumbsUp className="w-4 h-4 text-green-600" />
                  <span>Yes</span>
                </span>
                <span>{proposal.votes_for} ({yesPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={yesPercentage} className="h-2 bg-gray-200">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${yesPercentage}%` }} />
              </Progress>
            </div>

            {/* No votes */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="flex items-center space-x-2">
                  <ThumbsDown className="w-4 h-4 text-red-600" />
                  <span>No</span>
                </span>
                <span>{proposal.votes_against} ({noPercentage.toFixed(1)}%)</span>
              </div>
              <Progress value={noPercentage} className="h-2 bg-gray-200">
                <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${noPercentage}%` }} />
              </Progress>
            </div>

            {/* Abstain votes (if allowed) */}
            {proposal.voting_config.allow_abstain && (
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center space-x-2">
                    <Minus className="w-4 h-4 text-gray-600" />
                    <span>Abstain</span>
                  </span>
                  <span>{proposal.votes_abstain} ({abstainPercentage.toFixed(1)}%)</span>
                </div>
                <Progress value={abstainPercentage} className="h-2 bg-gray-200">
                  <div className="h-full bg-gray-500 rounded-full transition-all" style={{ width: `${abstainPercentage}%` }} />
                </Progress>
              </div>
            )}
          </div>

          {/* Quorum Status */}
          {proposal.voting_config.requires_quorum && (
            <div className="flex items-center space-x-2 text-sm">
              {quorumMet ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Quorum met ({totalVotes}/{requiredVotes} votes)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">Quorum not met ({totalVotes}/{requiredVotes} votes)</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Voting Interface */}
        {canVote && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-semibold">Cast Your Vote</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant={selectedVote === 'yes' ? 'default' : 'outline'}
                className={cn(
                  "h-auto p-4 flex flex-col items-center space-y-2",
                  selectedVote === 'yes' && "bg-green-600 hover:bg-green-700"
                )}
                onClick={() => setSelectedVote('yes')}
                disabled={isSubmitting}
              >
                <ThumbsUp className="w-6 h-6" />
                <span className="font-medium">Yes</span>
                <span className="text-xs text-center opacity-75">
                  Support this proposal
                </span>
              </Button>

              <Button
                variant={selectedVote === 'no' ? 'default' : 'outline'}
                className={cn(
                  "h-auto p-4 flex flex-col items-center space-y-2",
                  selectedVote === 'no' && "bg-red-600 hover:bg-red-700"
                )}
                onClick={() => setSelectedVote('no')}
                disabled={isSubmitting}
              >
                <ThumbsDown className="w-6 h-6" />
                <span className="font-medium">No</span>
                <span className="text-xs text-center opacity-75">
                  Oppose this proposal
                </span>
              </Button>

              {proposal.voting_config.allow_abstain && (
                <Button
                  variant={selectedVote === 'abstain' ? 'default' : 'outline'}
                  className={cn(
                    "h-auto p-4 flex flex-col items-center space-y-2",
                    selectedVote === 'abstain' && "bg-gray-600 hover:bg-gray-700"
                  )}
                  onClick={() => setSelectedVote('abstain')}
                  disabled={isSubmitting}
                >
                  <Minus className="w-6 h-6" />
                  <span className="font-medium">Abstain</span>
                  <span className="text-xs text-center opacity-75">
                    No strong opinion
                  </span>
                </Button>
              )}
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="vote-comment">Add a comment (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComment(!showComment)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  {showComment ? 'Hide' : 'Add'} Comment
                </Button>
              </div>

              {showComment && (
                <Textarea
                  id="vote-comment"
                  placeholder="Explain your reasoning (optional)"
                  value={voteComment}
                  onChange={(e) => setVoteComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                />
              )}
            </div>

            {/* Submit Vote */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {proposal.voting_config.is_anonymous ? (
                  <span>Your vote will be anonymous</span>
                ) : (
                  <span>Your vote will be public</span>
                )}
              </div>

              <Button
                onClick={() => selectedVote && handleVote(selectedVote)}
                disabled={!selectedVote || isSubmitting}
                className="bg-silas-green hover:bg-silas-green/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Vote'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Already Voted */}
        {hasVoted && (
          <div className="border-t pt-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You voted <strong>{userVote?.vote}</strong> on {format(new Date(userVote?.created_at || ''), 'PPp')}
                {userVote?.comment && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    "{userVote.comment}"
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Voting Closed */}
        {isVotingClosed && !hasVoted && (
          <div className="border-t pt-6">
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Voting has closed. The deadline was {format(new Date(proposal.voting_deadline), 'PPp')}.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  )
}