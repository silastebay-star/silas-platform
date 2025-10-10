/**
 * Create Proposal Modal Component
 */

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, MapPin, DollarSign, FileText, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useProposals } from '../hooks/useProposals'
import { useFeedback } from '@/lib/user-feedback'
import type { CreateProposalData } from '../types'

interface CreateProposalModalProps {
  isOpen: boolean
  onClose: () => void
  pinId?: string // Optional link to a map pin
  pinLocation?: {
    title: string
    address?: string
  }
}

const PROPOSAL_CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure & Development', icon: '🏗️' },
  { value: 'community', label: 'Community Programs', icon: '👥' },
  { value: 'environment', label: 'Environmental Initiatives', icon: '🌱' },
  { value: 'education', label: 'Education & Learning', icon: '📚' },
  { value: 'health', label: 'Health & Wellbeing', icon: '🏥' },
  { value: 'arts', label: 'Arts & Culture', icon: '🎨' },
  { value: 'technology', label: 'Technology & Innovation', icon: '💻' },
  { value: 'emergency', label: 'Emergency Response', icon: '🚨' }
]

export default function CreateProposalModal({
  isOpen,
  onClose,
  pinId,
  pinLocation
}: CreateProposalModalProps) {
  const [formData, setFormData] = useState<CreateProposalData>({
    title: '',
    description: '',
    amount_requested: 0,
    category: '',
    voting_deadline: undefined,
    funding_goal: undefined,
    metadata: {},
    pin_id: pinId
  })
  const [votingDeadline, setVotingDeadline] = useState<Date>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { createProposal } = useProposals()
  const feedback = useFeedback()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.amount_requested <= 0) {
      newErrors.amount_requested = 'Amount must be greater than 0'
    } else if (formData.amount_requested > 100000) {
      newErrors.amount_requested = 'Amount cannot exceed £100,000'
    }

    if (votingDeadline && votingDeadline <= new Date()) {
      newErrors.voting_deadline = 'Voting deadline must be in the future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      feedback.formValidationError()
      return
    }

    try {
      setIsSubmitting(true)

      const proposalData: CreateProposalData = {
        ...formData,
        voting_deadline: votingDeadline?.toISOString(),
        funding_goal: formData.funding_goal || formData.amount_requested,
        metadata: {
          ...formData.metadata,
          pin_location: pinLocation
        }
      }

      await createProposal(proposalData)

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        amount_requested: 0,
        category: '',
        voting_deadline: undefined,
        funding_goal: undefined,
        metadata: {},
        pin_id: pinId
      })
      setVotingDeadline(undefined)
      setErrors({})
      onClose()

    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-silas-green" />
            Create Funding Proposal
          </DialogTitle>
          <DialogDescription className="">
            Submit a proposal for community funding. Your proposal will be reviewed and voted on by the community.
            {pinLocation && (
              <div className="flex items-center gap-1 mt-2 text-sm text-silas-green">
                <MapPin className="h-4 w-4" />
                Linked to: {pinLocation.title}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Proposal Title *
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a clear, descriptive title for your proposal"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {PROPOSAL_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>

          {/* Amount Requested */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount_requested">Amount Requested (£) *</Label>
              <Input
                id="amount_requested"
                type="number"
                min="1"
                max="100000"
                value={formData.amount_requested || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  amount_requested: parseFloat(e.target.value) || 0
                }))}
                placeholder="0"
                className={errors.amount_requested ? 'border-red-500' : ''}
              />
              {errors.amount_requested && (
                <p className="text-sm text-red-500">{errors.amount_requested}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="funding_goal">Funding Goal (£)</Label>
              <Input
                id="funding_goal"
                type="number"
                min="1"
                value={formData.funding_goal || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                  ...prev,
                  funding_goal: parseFloat(e.target.value) || undefined
                }))}
                placeholder="Same as requested amount"
                className=""
              />
              <p className="text-xs text-gray-500">
                Optional: Set a higher goal for stretch funding
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide a detailed description of your proposal, including objectives, implementation plan, expected outcomes, and community benefits..."
              rows={6}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500">
              Minimum 50 characters. Be specific about how the funds will be used.
            </p>
          </div>

          {/* Voting Deadline */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Voting Deadline (Optional)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !votingDeadline && "text-muted-foreground",
                    errors.voting_deadline && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {votingDeadline ? format(votingDeadline, "PPP") : "Select deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={votingDeadline}
                  onSelect={setVotingDeadline}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.voting_deadline && (
              <p className="text-sm text-red-500">{errors.voting_deadline}</p>
            )}
            <p className="text-xs text-gray-500">
              If not set, voting will remain open indefinitely
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              disabled={isSubmitting}
              className=""
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="default"
              disabled={isSubmitting}
              className="bg-silas-green hover:bg-silas-green/90"
            >
              {isSubmitting ? 'Creating...' : 'Create Proposal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
