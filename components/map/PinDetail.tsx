'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Heart, MessageCircle, Share2, Calendar, User, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePinsStore, type Pin } from '@/store/pins'
import { getCategoryColor } from '@/config/categories'
import { CommentList } from '@/components/comments/CommentList'
import { handleError } from '@/lib/error-handling'

interface PinDetailProps {
  pinId: string
  isOpen: boolean
  onClose: () => void
}

// Use getCategoryColor instead of hardcoded colors

export default function PinDetail({ pinId, isOpen, onClose }: PinDetailProps) {
  const { updatePin, deletePin } = usePinsStore()
  const [pin, setPin] = useState<Pin | null>(null)
  const [censusData, setCensusData] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && pinId) {
      const fetchPinAndCensusData = async () => {
        setIsLoading(true)
        try {
          const pinResponse = await fetch(`/api/pins/${pinId}`)
          if (!pinResponse.ok) {
            const errorData = await pinResponse.json()
            throw new Error(errorData.error || 'Failed to fetch pin details')
          }
          const pinData = await pinResponse.json()
          setPin(pinData)

          if (pinData.lat && pinData.lng) {
            const censusResponse = await fetch(`/api/census-data?lat=${pinData.lat}&lng=${pinData.lng}`)
            if (!censusResponse.ok) {
              const errorData = await censusResponse.json()
              throw new Error(errorData.error || 'Failed to fetch census data')
            }
            const census = await censusResponse.json()
            setCensusData(census[0]) // Assuming it returns an array with one object
          }
        } catch (error: any) {
          handleError(error, 'PinDetail - fetchPinAndCensusData', true)
        } finally {
          setIsLoading(false)
        }
      }
      fetchPinAndCensusData()
    }
  }, [isOpen, pinId])

  if (!isOpen) return null

  if (isLoading || !pin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-silas-green"></div>
        </div>
      </div>
    )
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: pin.title,
        text: pin.description,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `${pin.title}\n${pin.description}\nLocation: ${pin.lat}, ${pin.lng}`
      )
      alert('Pin details copied to clipboard!')
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this pin?')) {
      try {
        await deletePin(pin.id)
        onClose()
      } catch (error: any) {
        handleError(error, 'PinDetail - handleDelete', true)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          {/* Photos */}
          {pin.photos && pin.photos.length > 0 ? (
            <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
              <img
                src={pin.photos[0]}
                alt={pin.title}
                className="w-full h-full object-cover"
              />
              {pin.photos.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  +{pin.photos.length - 1} more
                </div>
              )}
            </div>
          ) : (
            <div 
              className="h-48 rounded-t-lg flex items-center justify-center"
              style={{ backgroundColor: `${getCategoryColor(pin.categories[0] as CategoryKey)}20` }}
            >
              <MapPin 
                className="w-16 h-16"
                style={{ color: getCategoryColor(pin.categories[0] as CategoryKey) }}
              />
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Pin Type Badge */}
          <div className="absolute top-4 left-4">
            <span 
              className="inline-block px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: getCategoryColor(pin.categories[0] as CategoryKey) }}
            >
              {pin.categories[0].charAt(0).toUpperCase() + pin.categories[0].slice(1)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */} 
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-1 font-heading">{pin.title}</h2>
          </div>

          {/* Description */}
          {pin.description && (
            <div className="mb-4">
              <p className="text-gray-700 leading-relaxed">{pin.description}</p>
            </div>
          )}

          {/* Location */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                {pin.lat?.toFixed(6)}, {pin.lng?.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Added {formatDate(pin.created_at)}</span>
            </div>
            
            {pin.author_id && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>By {pin.author_id}</span>
              </div>
            )}

            {censusData && (
              <div className="pt-4 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2 font-heading">Census Data</h3>
                <p className="text-sm text-gray-700">LSOA Code: {censusData.lsoa_code}</p>
                <p className="text-sm text-gray-700">Population: {censusData.population}</p>
                <p className="text-sm text-gray-700">Deprivation Index: {censusData.deprivation_index?.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Social Actions (Simplified) */}
          <div className="flex items-center justify-between py-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleShare}
                className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>

            {/* Admin Actions */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="text-xs text-red-600 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3 font-heading">Comments</h3>
            <CommentList pinId={pin.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
