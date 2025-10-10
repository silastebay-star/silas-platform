'use client'

import { useState, useEffect } from 'react'
import { X, MapPin, Heart, MessageCircle, Share2, Calendar, User, Edit, Trash2, Image, Activity, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { usePinsStore, type Pin } from '@/store/pins'
import { getCategoryColor, getCategoryByKey } from '@/config/categories'
import Comments from '@/components/Comments'
import Reactions, { LikeButton } from '@/components/Reactions'
import PinActions from '@/components/PinActions'
import ImageGallery from '@/components/ImageGallery'

interface PinDrawerProps {
  pin: Pin | null
  isOpen: boolean
  onClose: () => void
}

export default function PinDrawer({ pin, isOpen, onClose }: PinDrawerProps) {
  const { updatePin, deletePin } = usePinsStore()


  const [activeTab, setActiveTab] = useState('overview')



  if (!pin) return null

  const category = getCategoryByKey(pin.type)
  const categoryColor = getCategoryColor(pin.type)







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
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div className={`
        fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="relative">
          {/* Hero Image/Color */}
          {pin.photos && pin.photos.length > 0 ? (
            <div className="h-48 bg-gray-200 overflow-hidden relative">
              <img
                src={pin.photos[0]}
                alt={pin.title}
                className="w-full h-full object-cover"
              />
              {pin.photos.length > 1 && (
                <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white">
                  +{pin.photos.length - 1} more
                </Badge>
              )}
            </div>
          ) : (
            <div 
              className="h-48 flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <MapPin 
                className="w-16 h-16"
                style={{ color: categoryColor }}
              />
            </div>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2"
          >
            <X className="w-5 h-5 text-gray-600" />
          </Button>

          {/* Category Badge */}
          <Badge
            variant="default"
            className="absolute top-4 left-4 text-white font-medium"
            style={{ backgroundColor: categoryColor }}
          >
            {category?.icon} {category?.label}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100vh-12rem)] overflow-hidden">
          {/* Pin Info */}
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-1 font-heading">{pin.title}</h2>
            {pin.description && (
              <p className="text-gray-600 text-sm line-clamp-2">{pin.description}</p>
            )}
            
            {/* Quick Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4">
                <LikeButton pinId={pin.id} />

                <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{pin.comments || 0}</span>
                </button>


              </div>

              <div className="flex items-center space-x-2">
                <PinActions
                  pin={pin}
                  onClose={onClose}
                  currentUserId="current_user" // TODO: Get from auth
                  isAdmin={false} // TODO: Get from auth
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
              <TabsTrigger value="overview" className="text-xs">
                <Info className="w-4 h-4 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="media" className="text-xs">
                <Image className="w-4 h-4 mr-1" />
                Media
              </TabsTrigger>
              <TabsTrigger value="discussion" className="text-xs">
                <MessageCircle className="w-4 h-4 mr-1" />
                Discussion
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs">
                <Activity className="w-4 h-4 mr-1" />
                Activity
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="overview" className="p-6 space-y-4">
                {/* Description */}
                {pin.description && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{pin.description}</p>
                  </div>
                )}

                {/* Location */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Location</h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}</span>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Added {formatDate(pin.created_at)}</span>
                    </div>
                    
                    {pin.created_by && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>By {pin.created_by}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="w-4 h-4 rounded-full" style={{ backgroundColor: categoryColor }} aria-label="Category color"></span>
                      <span>{category?.label}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media" className="p-6">
                {pin.photos && pin.photos.length > 0 ? (
                  <ImageGallery
                    images={pin.photos}
                    alt={pin.title}
                    className="w-full"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No media available</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="discussion" className="p-6">
                <Comments pinId={pin.id} />
              </TabsContent>

              <TabsContent value="activity" className="p-6 space-y-6">
                {/* Reactions */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Reactions</h3>
                  <Reactions pinId={pin.id} size="sm" />
                </div>

                {/* Activity Timeline */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Pin created</span>
                      <span className="text-gray-400">{formatDate(pin.created_at)}</span>
                    </div>

                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-gray-600">{pin.comments || 0} comments</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  )
}
