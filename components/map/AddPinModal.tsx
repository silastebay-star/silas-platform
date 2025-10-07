'use client'

import { useState } from 'react'
import { X, MapPin, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, CategoryKey } from '@/config/categories'

interface AddPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pinData: any) => void
  location: { lat: number; lng: number } | null
}

// Use the CATEGORIES from config instead of hardcoded PIN_TYPES

export default function AddPinModal({ isOpen, onClose, onSubmit, location }: AddPinModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'community' as CategoryKey,
    category: '',
    photos: [] as string[]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen || !location) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a title for the pin')
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
      setFormData({
        title: '',
        description: '',
        type: 'community',
        category: '',
        photos: []
      })
    } catch (error) {
      console.error('Error adding pin:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // In a real app, you'd upload to Supabase Storage here
    // For now, we'll just simulate it
    const photoUrls = Array.from(files).map(file => URL.createObjectURL(file))
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...photoUrls]
    }))
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

          {/* Type */}
          <div>
            <Label htmlFor="type">Pin Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value: CategoryKey) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select pin type" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.filter(cat => cat.key !== 'issues').map((category) => (
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

          {/* Category */}
          <div>
            <Label htmlFor="category">Category (Optional)</Label>
            <Input
              id="category"
              type="text"
              value={formData.category}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Restaurant, Park, School..."
              className="mt-1"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label htmlFor="photos">Photos (Optional)</Label>
            <div className="mt-1">
              <label className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex flex-col items-center">
                  <Camera className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload photos</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 10MB</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo Preview */}
            {formData.photos.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={photo}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          photos: prev.photos.filter((_, i) => i !== index)
                        }))
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              disabled={isSubmitting}
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
