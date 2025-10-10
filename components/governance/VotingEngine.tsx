'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface VotingEngineProps {
  proposalId: string
}

export function VotingEngine({ proposalId }: VotingEngineProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVote = async (vote: 'yes' | 'no' | 'abstain') => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId, vote }),
      })

      if (!response.ok) {
        throw new Error('Failed to cast vote')
      }

      // Optionally, update the UI to show that the user has voted
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex space-x-4">
      <Button onClick={() => handleVote('yes')} disabled={isSubmitting}>Yes</Button>
      <Button onClick={() => handleVote('no')} disabled={isSubmitting}>No</Button>
      <Button onClick={() => handleVote('abstain')} disabled={isSubmitting}>Abstain</Button>
    </div>
  )
}