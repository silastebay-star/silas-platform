/**
 * Pin Card Component
 * Display component for individual pins with interactions
 */

'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  MapPin, 
  Calendar, 
  Tag, 
  MoreHorizontal,
  Share2,
  Flag,
  Edit,
  Trash2,
  Users,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/lib/auth/auth-context'
import pinService, { Pin } from '@/lib/services/pin-service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const PIN_CATEGORY_CONFIG = {
  community: { label: 'Community', icon: '👥', color: 'bg-blue-100 text-blue-800' },
  faith: { label: 'Faith', icon: '🙏', color: 'bg-purple-100 text-purple-800' },
  projects: { label: 'Projects', icon: '🚧', color: 'bg-orange-100 text-orange-800' },
  economy: { label: 'Economy', icon: '💼', color: 'bg-green-100 text-green-800' },
  events: { label: 'Events', icon: '📅', color: 'bg-pink-100 text-pink-800' },
  environment: { label: 'Environment', icon: '🌿', color: 'bg-emerald-100 text-emerald-800' },
  safety: { label: 'Safety', icon: '🚨', color: 'bg-red-100 text-red-800' },
  data_ai: { label: 'Data & AI', icon: '🤖', color: 'bg-cyan-100 text-cyan-800' },
  issues: { label: 'Issues', icon: '⚠️', color: 'bg-red-100 text-red-800' },
  heritage_culture: { label: 'Heritage & Culture', icon: '🏛️', color: 'bg-amber-100 text-amber-800' },
  governance: { label: 'Governance', icon: '🏛️', color: 'bg-gray-100 text-gray-800' }
}

interface PinCardProps {
  pin: Pin
  onUpdate?: (pin: Pin) => void
  onDelete?: (pinId: string) => void
  onClick?: (pin: Pin) => void
  showDistance?: boolean
  distance?: number
  className?: string
  compact?: boolean
}

export default function PinCard({
  pin,
  onUpdate,
  onDelete,
  onClick,
  showDistance = false,
  distance,
  className = "",
  compact = false
}: PinCardProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [localLikeCount, setLocalLikeCount] = useState(pin.like_count)
  const [localUserHasLiked, setLocalUserHasLiked] = useState(pin.user_has_liked)
  const { user, isAuthenticated } = useAuth()

  const categoryConfig = PIN_CATEGORY_CONFIG[pin.category] || { label: 'Other', icon: '📌', color: 'bg-gray-100 text-gray-800' }
  const canEdit = user && (user.id === pin.created_by || user.role === 'admin' || user.role === 'moderator')
  const isExpired = pin.expires_at && new Date(pin.expires_at) < new Date()

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isAuthenticated) {
      toast.error('Please sign in to like pins')
      return
    }

    if (isLiking) return

    try {
      setIsLiking(true)
      const result = await pinService.togglePinLike(pin.id)
      
      setLocalLikeCount(result.likeCount)
      setLocalUserHasLiked(result.liked)
      
      if (result.liked) {
        toast.success('Pin liked!')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      toast.error('Failed to update like')
    } finally {
      setIsLiking(false)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: pin.title,
          text: pin.description || '',
          url: `${window.location.origin}/pins/${pin.id}`
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`${window.location.origin}/pins/${pin.id}`)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleReport = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement report functionality
    toast.info('Report functionality coming soon')
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement edit functionality
    toast.info('Edit functionality coming soon')
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this pin?')) {
      return
    }

    try {
      await pinService.deletePin(pin.id)
      toast.success('Pin deleted successfully')
      onDelete?.(pin.id)
    } catch (error) {
      console.error('Error deleting pin:', error)
      toast.error('Failed to delete pin')
    }
  }

  const handleCardClick = () => {
    onClick?.(pin)
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isExpired && "opacity-75",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className={cn("pb-3", compact && "pb-2")}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Creator Avatar */}
            <Avatar className="h-8 w-8">
              <AvatarImage src={pin.creator?.avatar_url || ''} />
              <AvatarFallback>
                {pin.creator?.full_name?.[0] || pin.creator?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">
                  {pin.creator?.full_name || pin.creator?.username || 'Anonymous'}
                </span>
                {pin.group && (
                  <>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Users className="h-3 w-3" />
                      <span className="truncate">{pin.group.name}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatDistanceToNow(new Date(pin.created_at), { addSuffix: true })}</span>
                {showDistance && distance !== undefined && (
                  <>
                    <span>•</span>
                    <span>{distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`} away</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="" align="end">
              <DropdownMenuItem className="" inset={false} onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              
              {canEdit && (
                <>
                  <DropdownMenuItem className="" inset={false} onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" inset={false} onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="" />
                </>
              )}
              
              <DropdownMenuItem className="" inset={false} onClick={handleReport}>
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category and Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={categoryConfig.color} variant="default">
            <span className="mr-1">{categoryConfig.icon}</span>
            {categoryConfig.label}
          </Badge>
          
          {pin.is_featured && (
            <Badge className="" variant="secondary">Featured</Badge>
          )}
          
          {isExpired && (
            <Badge className="" variant="destructive">Expired</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", compact && "pb-3")}>
        {/* Title and Description */}
        <div className="space-y-2 mb-4">
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {pin.title}
          </h3>
          
          {pin.description && !compact && (
            <p className="text-gray-600 text-sm line-clamp-3">
              {pin.description}
            </p>
          )}
        </div>

        {/* Images */}
        {pin.images.length > 0 && (
          <div className="mb-4">
            {pin.images.length === 1 ? (
              <img
                src={pin.images[0]}
                alt="Pin image"
                className="w-full h-48 object-cover rounded-lg"
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {pin.images.slice(0, 4).map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Pin image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    {index === 3 && pin.images.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <span className="text-white font-medium">
                          +{pin.images.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {pin.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mb-4">
            {pin.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {pin.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{pin.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Address */}
        {pin.address && !compact && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{pin.address}</span>
          </div>
        )}

        {/* Expiry */}
        {pin.expires_at && !compact && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <Calendar className="h-4 w-4" />
            <span>
              {isExpired ? 'Expired' : 'Expires'} {formatDistanceToNow(new Date(pin.expires_at), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "h-8 px-2 gap-1",
                localUserHasLiked && "text-red-600"
              )}
            >
              <Heart className={cn("h-4 w-4", localUserHasLiked && "fill-current")} />
              <span className="text-sm">{localLikeCount}</span>
            </Button>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MessageCircle className="h-4 w-4" />
              <span>{pin.comment_count}</span>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>{pin.view_count}</span>
            </div>
          </div>

          <Button variant="ghost" size="sm" className="h-8 px-2">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
