/**
 * Create Proposal Form Component
 * Comprehensive form for creating community proposals with rich text, attachments, and voting options
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { 
  FileText, 
  Upload, 
  Calendar as CalendarIcon, 
  Users, 
  Vote, 
  MapPin,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const proposalSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.enum(['infrastructure', 'environment', 'housing', 'business', 'culture', 'safety', 'education', 'governance']),
  action: z.enum(['create_pin', 'edit_pin', 'delete_pin', 'fund_request', 'project_milestone', 'policy_change', 'budget_allocation']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  votingDeadline: z.date().min(new Date(Date.now() + 24 * 60 * 60 * 1000), 'Voting deadline must be at least 24 hours from now'),
  requiresQuorum: z.boolean(),
  quorumPercentage: z.number().min(10).max(100).optional(),
  allowAbstain: z.boolean(),
  isAnonymous: z.boolean(),
  attachments: z.array(z.instanceof(File)).max(5, 'Maximum 5 attachments allowed'),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
  relatedPinId: z.string().optional(),
  budgetAmount: z.number().min(0).optional(),
  expectedOutcome: z.string().min(20, 'Expected outcome must be at least 20 characters')
})

type ProposalFormData = z.infer<typeof proposalSchema>

interface CreateProposalFormProps {
  onSuccess?: (proposal: any) => void
  onCancel?: () => void
  initialData?: Partial<ProposalFormData>
  className?: string
}

const PROPOSAL_CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure & Planning', icon: '🏗️' },
  { value: 'environment', label: 'Environment & Sustainability', icon: '🌱' },
  { value: 'housing', label: 'Housing & Development', icon: '🏠' },
  { value: 'business', label: 'Business & Economy', icon: '💼' },
  { value: 'culture', label: 'Arts & Culture', icon: '🎨' },
  { value: 'safety', label: 'Safety & Security', icon: '🛡️' },
  { value: 'education', label: 'Education & Learning', icon: '📚' },
  { value: 'governance', label: 'Governance & Policy', icon: '⚖️' }
]

const PROPOSAL_ACTIONS = [
  { value: 'create_pin', label: 'Create New Pin', description: 'Add a new location or issue to the map' },
  { value: 'edit_pin', label: 'Edit Existing Pin', description: 'Modify information about an existing pin' },
  { value: 'delete_pin', label: 'Remove Pin', description: 'Remove a pin from the map' },
  { value: 'fund_request', label: 'Funding Request', description: 'Request community funding for a project' },
  { value: 'project_milestone', label: 'Project Milestone', description: 'Propose a new project milestone' },
  { value: 'policy_change', label: 'Policy Change', description: 'Propose changes to community policies' },
  { value: 'budget_allocation', label: 'Budget Allocation', description: 'Propose how to allocate community funds' }
]

export default function CreateProposalForm({ 
  onSuccess, 
  onCancel, 
  initialData, 
  className = "" 
}: CreateProposalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
    setError,
    clearErrors
  } = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      priority: 'normal',
      requiresQuorum: true,
      quorumPercentage: 25,
      allowAbstain: true,
      isAnonymous: false,
      attachments: [],
      tags: [],
      ...initialData
    }
  })

  const watchedCategory = watch('category')
  const watchedAction = watch('action')
  const watchedRequiresQuorum = watch('requiresQuorum')
  const watchedVotingDeadline = watch('votingDeadline')

  const onSubmit = async (data: ProposalFormData) => {
    try {
      setIsSubmitting(true)
      clearErrors()

      // Prepare form data for submission
      const formData = new FormData()
      
      // Add basic proposal data
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      formData.append('action', data.action)
      formData.append('priority', data.priority)
      formData.append('voting_deadline', data.votingDeadline.toISOString())
      formData.append('expected_outcome', data.expectedOutcome)
      
      // Add voting configuration
      const votingConfig = {
        requires_quorum: data.requiresQuorum,
        quorum_percentage: data.quorumPercentage,
        allow_abstain: data.allowAbstain,
        is_anonymous: data.isAnonymous
      }
      formData.append('voting_config', JSON.stringify(votingConfig))
      
      // Add optional fields
      if (data.relatedPinId) formData.append('related_pin_id', data.relatedPinId)
      if (data.budgetAmount) formData.append('budget_amount', data.budgetAmount.toString())
      
      // Add tags
      formData.append('tags', JSON.stringify(tags))
      
      // Add attachments
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file)
      })

      const response = await fetch('/api/proposals', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create proposal')
      }

      const proposal = await response.json()
      onSuccess?.(proposal)
      
    } catch (error) {
      console.error('Error creating proposal:', error)
      setError('root', { 
        message: error instanceof Error ? error.message : 'Failed to create proposal' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (attachments.length + files.length > 5) {
      setError('attachments', { message: 'Maximum 5 attachments allowed' })
      return
    }
    
    setAttachments(prev => [...prev, ...files])
    setValue('attachments', [...attachments, ...files])
  }

  const removeAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    setAttachments(newAttachments)
    setValue('attachments', newAttachments)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      setValue('tags', updatedTags)
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    setTags(updatedTags)
    setValue('tags', updatedTags)
  }

  return (
    <Card className={cn("w-full max-w-4xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Vote className="w-6 h-6 text-silas-green" />
          <CardTitle>Create Community Proposal</CardTitle>
        </div>
        <CardDescription>
          Submit a proposal for community consideration and voting
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {errors.root && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select onValueChange={(value) => setValue('category', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center space-x-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* Action Type */}
              <div className="space-y-2">
                <Label htmlFor="action">Action Type *</Label>
                <Select onValueChange={(value) => setValue('action', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_ACTIONS.map((action) => (
                      <SelectItem key={action.value} value={action.value}>
                        <div className="space-y-1">
                          <div className="font-medium">{action.label}</div>
                          <div className="text-xs text-gray-500">{action.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.action && (
                  <p className="text-sm text-red-600">{errors.action.message}</p>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title *</Label>
              <Input
                id="title"
                placeholder="Enter a clear, descriptive title for your proposal"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide a comprehensive description of your proposal, including background, rationale, and implementation details"
                rows={6}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Expected Outcome */}
            <div className="space-y-2">
              <Label htmlFor="expectedOutcome">Expected Outcome *</Label>
              <Textarea
                id="expectedOutcome"
                placeholder="Describe the expected results and benefits if this proposal is approved"
                rows={3}
                {...register('expectedOutcome')}
                className={errors.expectedOutcome ? 'border-red-500' : ''}
              />
              {errors.expectedOutcome && (
                <p className="text-sm text-red-600">{errors.expectedOutcome.message}</p>
              )}
            </div>
          </div>

          {/* Voting Configuration */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Vote className="w-5 h-5" />
              <span>Voting Configuration</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Voting Deadline */}
              <div className="space-y-2">
                <Label>Voting Deadline *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !watchedVotingDeadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {watchedVotingDeadline ? format(watchedVotingDeadline, "PPP") : "Select deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={watchedVotingDeadline}
                      onSelect={(date) => date && setValue('votingDeadline', date)}
                      disabled={(date) => date < new Date(Date.now() + 24 * 60 * 60 * 1000)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.votingDeadline && (
                  <p className="text-sm text-red-600">{errors.votingDeadline.message}</p>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority Level</Label>
                <Select onValueChange={(value) => setValue('priority', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Voting Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requiresQuorum"
                  checked={watchedRequiresQuorum}
                  onCheckedChange={(checked) => setValue('requiresQuorum', checked)}
                />
                <Label htmlFor="requiresQuorum">Require minimum participation (quorum)</Label>
              </div>

              {watchedRequiresQuorum && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="quorumPercentage">Minimum Participation Percentage</Label>
                  <Input
                    id="quorumPercentage"
                    type="number"
                    min="10"
                    max="100"
                    placeholder="25"
                    {...register('quorumPercentage', { valueAsNumber: true })}
                    className="w-32"
                  />
                  {errors.quorumPercentage && (
                    <p className="text-sm text-red-600">{errors.quorumPercentage.message}</p>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="allowAbstain"
                  {...register('allowAbstain')}
                />
                <Label htmlFor="allowAbstain">Allow abstain votes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAnonymous"
                  {...register('isAnonymous')}
                />
                <Label htmlFor="isAnonymous">Anonymous voting</Label>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Advanced Options</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-4">
                {/* Budget Amount */}
                {(watchedAction === 'fund_request' || watchedAction === 'budget_allocation') && (
                  <div className="space-y-2">
                    <Label htmlFor="budgetAmount">Budget Amount (£)</Label>
                    <Input
                      id="budgetAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...register('budgetAmount', { valueAsNumber: true })}
                    />
                    {errors.budgetAmount && (
                      <p className="text-sm text-red-600">{errors.budgetAmount.message}</p>
                    )}
                  </div>
                )}

                {/* Related Pin */}
                <div className="space-y-2">
                  <Label htmlFor="relatedPinId">Related Map Pin (Optional)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="relatedPinId"
                      placeholder="Enter pin ID or select from map"
                      {...register('relatedPinId')}
                    />
                    <Button type="button" variant="outline" size="sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      Select
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* File Attachments */}
                <div className="space-y-2">
                  <Label>Attachments (Max 5 files, 10MB each)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center space-y-2"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Click to upload files or drag and drop
                      </span>
                      <span className="text-xs text-gray-500">
                        PDF, DOC, TXT, JPG, PNG up to 10MB each
                      </span>
                    </label>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.attachments && (
                    <p className="text-sm text-red-600">{errors.attachments.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4" />
              <span>Proposal will be submitted for community review</span>
            </div>

            <div className="flex space-x-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="bg-silas-green hover:bg-silas-green/90"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <Vote className="w-4 h-4 mr-2" />
                    Create Proposal
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
