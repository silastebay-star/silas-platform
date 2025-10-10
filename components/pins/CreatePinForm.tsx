/**
 * Create Pin Form Component
 * Complete form for creating new pins with image upload and validation
 */

'use client'

import { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Upload, X, Loader2, Tag, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/lib/auth/auth-context'
import pinService, { PinCategory, CreatePinData } from '@/lib/services/pin-service'
import { toast } from 'sonner'

const PIN_CATEGORIES: { value: PinCategory; label: string; description: string; icon: string }[] = [
  { value: 'community', label: 'Community & Groups', description: 'Groups, clubs and membership hubs', icon: '👥' },
  { value: 'projects', label: 'Projects & Initiatives', description: 'Local action & volunteer projects', icon: '🔨' },
  { value: 'events', label: 'Events & Experiences', description: 'Community events & booking', icon: '📅' },
  { value: 'economy', label: 'Economy & Commerce', description: 'Local businesses, marketplaces', icon: '💼' },
  { value: 'environment', label: 'Environment & Wildlife', description: 'Environmental protection & wildlife conservation', icon: '🌿' },
  { value: 'safety', label: 'Safety & Response', description: 'Emergency response & community safety', icon: '🚨' },
  { value: 'faith', label: 'Faith & Reflection', description: 'Services, chaplaincy, reflections', icon: '🙏' },
  { value: 'data_ai', label: 'Data, AI & Insight', description: 'Dashboards, polls, civic analytics', icon: '📊' }
]

const createPinSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  category: z.enum(['community', 'projects', 'events', 'economy', 'environment', 'safety', 'faith', 'data_ai']),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  tags: z.string().optional(),
  expires_at: z.string().optional(),
  group_id: z.string().optional()
})

type CreatePinFormData = z.infer<typeof createPinSchema>

interface CreatePinFormProps {
  location: { lat: number; lng: number }
  onSuccess?: (pin: any) => void
  onCancel?: () => void
  className?: string
  groups?: Array<{ id: string; name: string; category: PinCategory }>
}

export default function CreatePinForm({
  location,
  onSuccess,
  onCancel,
  className = "",
  groups = []
}: CreatePinFormProps) {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError,
    clearErrors
  } = useForm<CreatePinFormData>({
    resolver: zodResolver(createPinSchema)
  })

  const selectedCategory = watch('category')
  const selectedGroupId = watch('group_id')

  // Filter groups by selected category
  const filteredGroups = groups.filter(group => 
    !selectedCategory || group.category === selectedCategory
  )

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (images.length + files.length > 5) {
      toast.error('You can upload a maximum of 5 images')
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error(`${file.name} is too large. Maximum size is 5MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setImages(prev => [...prev, ...validFiles])

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviewUrls(prev => [...prev, ...newPreviewUrls])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index])
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: CreatePinFormData) => {
    try {
      setIsSubmitting(true)
      clearErrors()

      if (!user) {
        throw new Error('You must be logged in to create a pin')
      }

      // Parse tags
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : []

      const pinData: CreatePinData = {
        title: data.title,
        description: data.description,
        category: data.category,
        location,
        address: data.address,
        images: images.length > 0 ? images : undefined,
        tags,
        expires_at: data.expires_at || undefined,
        group_id: data.group_id || undefined
      }

      const pin = await pinService.createPin(pinData)
      
      toast.success('Pin created successfully!')
      onSuccess?.(pin)
    } catch (error) {
      console.error('Error creating pin:', error)
      const message = error instanceof Error ? error.message : 'Failed to create pin'
      toast.error(message)
      setError('root', { message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-silas-green" />
          Add Community Pin
        </CardTitle>
        <CardDescription className="">
          Share something important with your community at this location
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {errors.root && (
            <Alert className="" variant="destructive">
              <AlertDescription className="">{errors.root.message}</AlertDescription>
            </Alert>
          )}

          {/* Location Display */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              className=""
              type="text"
              id="title"
              placeholder="What's happening here?"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIN_CATEGORIES.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <div>
                            <div className="font-medium">{category.label}</div>
                            <div className="text-xs text-gray-500">{category.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Group Selection */}
          {filteredGroups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="group_id">Post to Group (Optional)</Label>
              <Controller
                name="group_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No group (public pin)</SelectItem>
                      {filteredGroups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Tell us more about this..."
              rows={3}
              {...register('description')}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address (Optional)</Label>
            <Input
              className=""
              type="text"
              id="address"
              placeholder="e.g., 123 Main Street, Stoneclough"
              {...register('address')}
              disabled={isSubmitting}
            />
            {errors.address && (
              <p className="text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <Input
              className=""
              type="text"
              id="tags"
              placeholder="e.g., urgent, help-needed, volunteer"
              {...register('tags')}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Separate tags with commas to help others find your pin
            </p>
            {errors.tags && (
              <p className="text-sm text-red-600">{errors.tags.message}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expires_at">Expires (Optional)</Label>
            <Input
              className=""
              id="expires_at"
              type="datetime-local"
              {...register('expires_at')}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Set when this pin should automatically be archived
            </p>
          </div>

          <Separator className="" />

          {/* Image Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Images (Optional)</Label>
              <Button
                className=""
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || images.length >= 5}
              >
                <Upload className="h-4 w-4 mr-2" />
                Add Images
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {imagePreviewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500">
              Upload up to 5 images (max 5MB each). Supported formats: JPG, PNG, GIF
            </p>
          </div>
        </CardContent>

        <div className="flex gap-3 p-6 pt-0">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="default"
            size="default"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Pin...
              </>
            ) : (
              'Create Pin'
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
