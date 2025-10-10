'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CreateProposalForm() {
  const [action, setAction] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!action.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload: {} }),
      })

      if (!response.ok) {
        throw new Error('Failed to create proposal')
      }

      setAction('')
      // Optionally, trigger a refetch of the proposal list
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="action">Action</Label>
        <Input
          id="action"
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Enter a proposal action..."
          className="mt-1"
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating proposal...' : 'Create Proposal'}
      </Button>
    </form>
  )
}