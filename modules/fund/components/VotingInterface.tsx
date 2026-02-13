/**
 * Voting Interface Component
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { useVoting } from '../hooks/useVoting'
import { useFeedback } from '@/lib/user-feedback'
import type { Proposal, Vote } from '../types'

interface VotingInterfaceProps {
  proposal: Proposal
  className?: string
}

export default function VotingInterface({ proposal, className }: VotingInterfaceProps) {
  const [comment, setComment] = useState('')
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [selectedVoteType, setSelectedVoteType] = useState<'for' | 'against' | 'abstain' | null>(null)

  const {
    votes,
    userVote,
    votingStats,
    loading,
    castVote,
    removeVote
  } = useVoting(proposal.id)

  const feedback = useFeedback()

  const handleVote = async (voteType: 'for' | 'against' | 'abstain') => {
    try {
      await castVote({
        proposal_id: proposal.id,
        vote_type: voteType,
        comment: comment.trim() || undefined
      })

      setComment('')
      setShowCommentForm(false)
      setSelectedVoteType(null)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const handleVoteWithComment = (voteType: 'for' | 'against' | 'abstain') => {
    setSelectedVoteType(voteType)
    setShowCommentForm(true)
  }

  const handleRemoveVote = async () => {
    try {
      await removeVote(proposal.id)
    } catch (error) {
      // Error handling is done in the hook
    }
  }

  const approvalPercentage = votingStats?.approval_percentage || 0
  const isVotingClosed = proposal.status !== 'active' ||
    (proposal.voting_deadline && new Date(proposal.voting_deadline) < new Date())

  return (
    <div className={cn("space-y-6", className)}>
      {/* Voting Statistics */}
      <Card className="">
        <CardHeader className="">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Voting Results
          </CardTitle>
          <CardDescription className="">
            Current voting status for this proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {votingStats?.votes_for || 0}
              </div>
              <div className="text-sm text-green-700">Support</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {votingStats?.votes_against || 0}
              </div>
              <div className="text-sm text-red-700">Opposition</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {votingStats?.votes_abstain || 0}
              </div>
              <div className="text-sm text-gray-700">Abstain</div>
            </div>
          </div>

          {votingStats && votingStats.total_votes > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Approval Rate</span>
                <span className="font-medium">{approvalPercentage}%</span>
              </div>
              <Progress value={approvalPercentage} className="h-3" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{votingStats.total_votes} total votes</span>
                <span>
                  {approvalPercentage >= 60 ? '✅ Likely to pass' :
                   approvalPercentage >= 40 ? '⚖️ Close vote' : '❌ Unlikely to pass'}
                </span>
              </div>
            </div>
          )}

          {votingStats?.total_votes === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No votes yet. Be the first to vote!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Voting Actions */}
      {!isVotingClosed && (
        <Card className="">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Cast Your Vote
            </CardTitle>
            <CardDescription className="">
              {userVote
                ? "You have already voted. You can change your vote below."
                : "Choose your position on this proposal"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="">
            {!showCommentForm ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    size="lg"
                    variant={userVote?.vote_type === 'for' ? 'default' : 'outline'}
                    onClick={() => handleVoteWithComment('for')}
                    disabled={loading}
                    className="h-16 flex-col gap-1"
                  >
                    <ThumbsUp className="h-5 w-5" />
                    <span>Support</span>
                    <span className="text-xs opacity-70">Vote For</span>
                  </Button>

                  <Button
                    size="lg"
                    variant={userVote?.vote_type === 'against' ? 'destructive' : 'outline'}
                    onClick={() => handleVoteWithComment('against')}
                    disabled={loading}
                    className="h-16 flex-col gap-1"
                  >
                    <ThumbsDown className="h-5 w-5" />
                    <span>Oppose</span>
                    <span className="text-xs opacity-70">Vote Against</span>
                  </Button>

                  <Button
                    size="lg"
                    variant={userVote?.vote_type === 'abstain' ? 'secondary' : 'outline'}
                    onClick={() => handleVoteWithComment('abstain')}
                    disabled={loading}
                    className="h-16 flex-col gap-1"
                  >
                    <Minus className="h-5 w-5" />
                    <span>Abstain</span>
                    <span className="text-xs opacity-70">No Position</span>
                  </Button>
                </div>

                {userVote && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="">
                        Your vote: {userVote.vote_type}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(userVote.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveVote}
                      disabled={loading}
                      className=""
                    >
                      Remove Vote
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedVoteType === 'for' && <ThumbsUp className="h-4 w-4 text-green-600" />}
                    {selectedVoteType === 'against' && <ThumbsDown className="h-4 w-4 text-red-600" />}
                    {selectedVoteType === 'abstain' && <Minus className="h-4 w-4 text-gray-600" />}
                    <span className="font-medium">
                      Voting: {selectedVoteType ? selectedVoteType.charAt(0).toUpperCase() + selectedVoteType.slice(1) : ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vote-comment" className="">
                    Comment (Optional)
                  </Label>
                  <Textarea
                    id="vote-comment"
                    value={comment}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                    placeholder="Explain your reasoning for this vote..."
                    rows={3}
                    className=""
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="default"
                    size="default"
                    onClick={() => handleVote(selectedVoteType!)}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Submitting...' : 'Submit Vote'}
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      setShowCommentForm(false)
                      setSelectedVoteType(null)
                      setComment('')
                    }}
                    disabled={loading}
                    className=""
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isVotingClosed && (
        <Card className="">
          <CardContent className="pt-6">
            <div className="text-center py-4">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">
                Voting has closed for this proposal
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Votes */}
      {votes.length > 0 && (
        <Card className="">
          <CardHeader className="">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Votes ({votes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="">
            <div className="space-y-4">
              {votes.slice(0, 10).map((vote) => (
                <div key={vote.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={vote.user_profile?.avatar_url} />
                    <AvatarFallback>
                      {vote.user_profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {vote.user_profile?.name || 'Anonymous'}
                      </span>
                      <Badge
                        variant={vote.vote_type === 'for' ? 'default' :
                                vote.vote_type === 'against' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {vote.vote_type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    {vote.comment && (
                      <p className="text-sm text-gray-700">{vote.comment}</p>
                    )}
                  </div>
                </div>
              ))}

              {votes.length > 10 && (
                <div className="text-center">
                  <Button variant="outline" size="sm" className="">
                    View All Votes ({votes.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
