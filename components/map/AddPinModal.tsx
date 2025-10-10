'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Camera, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ImageUpload from '@/components/ImageUpload'
import { CATEGORIES, CategoryKey } from '@/config/categories'
import { validatePinLocation } from '@/lib/boundary-utils'

interface AddPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pinData: any) => void
  location: { lat: number; lng: number } | null
  authorId: string // New prop for author ID
}

// Use the CATEGORIES from config instead of hardcoded PIN_TYPES

export default function AddPinModal({ isOpen, onClose, onSubmit, location, authorId }: AddPinModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'groups' as CategoryKey, // Default to 'groups'
    photos: [] as string[],
    metadata: {} as Record<string, any> // For category-specific data
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [boundaryValidation, setBoundaryValidation] = useState<{
    isValid: boolean
    message?: string
    suggestedLocation?: [number, number]
  } | null>(null)

  // Validate location when modal opens or location changes
  useEffect(() => {
    if (location) {
      const validation = validatePinLocation(location.lng, location.lat)
      setBoundaryValidation(validation)
    }
  }, [location])

  if (!isOpen || !location) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a title for the pin')
      return
    }

    setIsSubmitting(true)
    
    try {
      const pinData = {
        ...formData,
        categories: [formData.category],
        lat: location.lat,
        lng: location.lng,
        metadata: formData.metadata // Include metadata
      };
      await onSubmit(pinData)
      setFormData({
        title: '',
        description: '',
        category: 'groups',
        photos: [],
        metadata: {}
      })
    } catch (error) {
      console.error('Error adding pin:', error)
    } finally {
      setIsSubmitting(false)
    }
  }



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-silas-green" />
            <h2 className="text-lg font-semibold text-gray-900 font-heading">Add New Pin</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Info */}
        <div className="px-6 py-3 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">
            <strong>Location:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
          </p>
        </div>

        {/* Boundary validation feedback */}
        {boundaryValidation && !boundaryValidation.isValid && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Location Outside Boundary</p>
                <p className="mt-1">{boundaryValidation.message}</p>
                {boundaryValidation.suggestedLocation && (
                  <p className="mt-2 text-xs">
                    Suggested location: {boundaryValidation.suggestedLocation[1].toFixed(6)}, {boundaryValidation.suggestedLocation[0].toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Pin Title *</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a descriptive title..."
              className="mt-1"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value: CategoryKey) => setFormData(prev => ({ ...prev, category: value, metadata: {} }))} // Reset metadata on category change
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select pin type" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category.key} value={category.key}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-lg mr-2">{category.icon}</span>
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Environmental Pin Type (Conditional) */}
          {formData.category === 'environment' && (
            <div>
              <Label htmlFor="environmentalPinType">Environmental Pin Type *</Label>
              <Select
                value={formData.metadata.environmentalPinType || ''}
                onValueChange={(value: string) => setFormData(prev => ({ ...prev, metadata: { ...prev.metadata, environmentalPinType: value } }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select environmental pin type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="habitat_site">Habitat Site</SelectItem>
                  <SelectItem value="canal_project">Canal Project</SelectItem>
                  <SelectItem value="tree_green_patch">Tree / Green Patch</SelectItem>
                  <SelectItem value="pollution_litter_report">Pollution / Litter Report</SelectItem>
                  <SelectItem value="community_garden">Community Garden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide more details about this pin..."
              className="mt-1"
              rows={3}
            />
          </div>



          {/* Photos */}
          <div>
            <Label>Photos (Optional)</Label>
            <div className="mt-1">
              <ImageUpload
                onImagesChange={(urls) => setFormData(prev => ({ ...prev, photos: urls }))}
                existingImages={formData.photos}
                maxImages={5}
                disabled={isSubmitting}
                authorId={authorId} // Pass authorId to ImageUpload
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add up to 5 photos to help others understand your pin better
            </p>
          </div>



          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="default"
              className="flex-1 bg-silas-green hover:bg-silas-green/90"
              disabled={isSubmitting || (boundaryValidation && !boundaryValidation.isValid)}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Pin'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
