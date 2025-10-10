'use client'

import { useState, useEffect } from 'react'
import { VotingEngine } from '@/components/governance/VotingEngine'

interface Proposal {
  id: string
  action: string
  status: string
  proposer_id: string
  created_at: string
}

function VoteCount({ proposalId }: { proposalId: string }) {
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchVoteCounts = async () => {
      try {
        const response = await fetch(`/api/proposals/${proposalId}/votes`)
        if (!response.ok) {
          throw new Error('Failed to fetch vote counts')
        }
        const data = await response.json()
        setVoteCounts(data)
      } catch (error) {
        console.error(error)
      }
    }

    fetchVoteCounts()
  }, [proposalId])

  return (
    <div className="text-xs text-gray-500 mt-2">
      <span>Yes: {voteCounts.yes || 0}</span>
      <span className="mx-2">•</span>
      <span>No: {voteCounts.no || 0}</span>
      <span className="mx-2">•</span>
      <span>Abstain: {voteCounts.abstain || 0}</span>
    </div>
  )
}

export function ProposalList() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchProposals = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/proposals')
      if (!response.ok) {
        throw new Error('Failed to fetch proposals')
      }
      const data = await response.json()
      setProposals(data)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProposals()
  }, [])

  if (isLoading) {
    return <div>Loading proposals...</div>
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div key={proposal.id} className="p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-800">{proposal.action}</p>
          <div className="text-xs text-gray-500 mt-2">
            <span>by {proposal.proposer_id}</span>
            <span className="mx-2">•</span>
            <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>{proposal.status}</span>
          </div>
          <VoteCount proposalId={proposal.id} />
          <div className="mt-4">
            <VotingEngine proposalId={proposal.id} />
          </div>
        </div>
      ))}
    </div>
  )
}