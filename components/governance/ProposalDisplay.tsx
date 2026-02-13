/**
 * Proposal Display Component
 * Comprehensive display for proposal details, voting results, discussion threads, and status tracking
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Calendar, 
  User, 
  MessageSquare, 
  Download, 
  ExternalLink,
  Clock,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Tag,
  MapPin,
  DollarSign
} from 'lucide-react'
import { format, formatDistanceToNow, isAfter } from 'date-fns'
import { VotingEngine } from './VotingEngine'
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
  expected_outcome: string
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
  related_pin?: {
    id: string
    title: string
    latitude: number
    longitude: number
  }
  budget_amount?: number
  tags?: string[]
  attachments?: string[]
  created_at: string
  updated_at: string
}

interface Comment {
  id: string
  content: string
  author: {
    id: string
    full_name: string
    username: string
    avatar_url?: string
  }
  created_at: string
  parent_comment_id?: string
  replies?: Comment[]
}

interface ProposalDisplayProps {
  proposalId: string
  className?: string
}

export default function ProposalDisplay({ proposalId, className }: ProposalDisplayProps) {
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [userVote, setUserVote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProposalData()
  }, [proposalId])

  const fetchProposalData = async () => {
    try {
      setLoading(true)
      
      // Fetch proposal details
      const proposalResponse = await fetch(`/api/proposals/${proposalId}`)
      if (!proposalResponse.ok) {
        throw new Error('Failed to fetch proposal')
      }
      const proposalData = await proposalResponse.json()
      setProposal(proposalData)

      // Fetch user's vote if authenticated
      const userVoteResponse = await fetch(`/api/votes?proposal_id=${proposalId}&user_id=current`)
      if (userVoteResponse.ok) {
        const voteData = await userVoteResponse.json()
        setUserVote(voteData)
      }

      // Fetch comments
      const commentsResponse = await fetch(`/api/proposals/${proposalId}/comments`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData)
      }

    } catch (error) {
      console.error('Error fetching proposal data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load proposal')
    } finally {
      setLoading(false)
    }
  }

  const handleVoteSuccess = () => {
    fetchProposalData() // Refresh data after voting
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-silas-green" />
      </div>
    )
  }

  if (error || !proposal) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || 'Proposal not found'}</AlertDescription>
      </Alert>
    )
  }

  const isVotingClosed = isAfter(new Date(), new Date(proposal.voting_deadline))
  const timeToDeadline = formatDistanceToNow(new Date(proposal.voting_deadline), { addSuffix: true })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'normal': return 'bg-blue-500 text-white'
      case 'low': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white'
      case 'approved': return 'bg-green-600 text-white'
      case 'rejected': return 'bg-red-500 text-white'
      case 'expired': return 'bg-gray-500 text-white'
      default: return 'bg-yellow-500 text-white'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'infrastructure': return '🏗️'
      case 'environment': return '🌱'
      case 'housing': return '🏠'
      case 'business': return '💼'
      case 'culture': return '🎨'
      case 'safety': return '🛡️'
      case 'education': return '📚'
      case 'governance': return '⚖️'
      default: return '📋'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Proposal Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{getCategoryIcon(proposal.category)}</span>
                <CardTitle className="text-2xl">{proposal.title}</CardTitle>
              </div>
              
              <div className="flex items-center space-x-2 flex-wrap">
                <Badge className={getPriorityColor(proposal.priority)}>
                  {proposal.priority} priority
                </Badge>
                <Badge className={getStatusColor(proposal.status)}>
                  {proposal.status}
                </Badge>
                <Badge variant="outline">
                  {proposal.category}
                </Badge>
                <Badge variant="outline">
                  {proposal.action.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Proposed by {proposal.proposer.full_name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(proposal.created_at), 'PPP')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span className={isVotingClosed ? 'text-red-600' : 'text-green-600'}>
                    Voting {isVotingClosed ? 'closed' : 'ends'} {timeToDeadline}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{proposal.total_votes} votes</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Expected Outcome</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{proposal.expected_outcome}</p>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              {proposal.budget_amount && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    Budget: £{proposal.budget_amount.toLocaleString()}
                  </span>
                </div>
              )}

              {proposal.related_pin && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">
                    Related to: {proposal.related_pin.title}
                  </span>
                </div>
              )}

              {proposal.tags && proposal.tags.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <div className="flex flex-wrap gap-1">
                    {proposal.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Attachments */}
            {proposal.attachments && proposal.attachments.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {proposal.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <span>Attachment {index + 1}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Voting Section */}
      <VotingEngine 
        proposal={proposal} 
        userVote={userVote}
        onVoteSuccess={handleVoteSuccess}
      />

      {/* Tabs for Discussion and Timeline */}
      <Tabs defaultValue="discussion" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="discussion" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Discussion ({comments.length})</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Timeline</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discussion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Community Discussion</CardTitle>
              <CardDescription>
                Share your thoughts and engage with other community members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={comment.author.avatar_url} />
                          <AvatarFallback>
                            {comment.author.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-sm">
                              {comment.author.full_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proposal Timeline</CardTitle>
              <CardDescription>
                Track the progress and key events of this proposal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div>
                    <p className="font-medium">Proposal Created</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(proposal.created_at), 'PPp')}
                    </p>
                  </div>
                </div>
                
                {proposal.status === 'active' && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="font-medium">Voting Started</p>
                      <p className="text-sm text-gray-600">Community voting is now open</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    isVotingClosed ? "bg-gray-500" : "bg-yellow-500"
                  )} />
                  <div>
                    <p className="font-medium">
                      Voting {isVotingClosed ? 'Ended' : 'Deadline'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(proposal.voting_deadline), 'PPp')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
