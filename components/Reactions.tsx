'use client'

import { useState, useEffect } from 'react'
import { Heart, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useReactionsStore, REACTION_CONFIG, type ReactionType } from '@/store/reactions'

interface ReactionsProps {
  pinId: string
  showAddButton?: boolean
  size?: 'sm' | 'md' | 'lg'
}

interface ReactionButtonProps {
  pinId: string
  reactionType: ReactionType
  count: number
  hasReacted: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick: () => void
}

function ReactionButton({ reactionType, count, hasReacted, size = 'md', onClick }: ReactionButtonProps) {
  const config = REACTION_CONFIG[reactionType]
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const emojiSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  return (
    <Button
      variant={hasReacted ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={`
        ${sizeClasses[size]} 
        ${hasReacted ? 'border-2' : 'border'} 
        transition-all duration-200 hover:scale-105
        ${hasReacted ? 'shadow-md' : ''}
      `}
      style={{
        borderColor: hasReacted ? config.color : undefined,
        backgroundColor: hasReacted ? `${config.color}20` : undefined,
        color: hasReacted ? config.color : undefined
      }}
    >
      <span className={`${emojiSizes[size]} mr-1`}>{config.emoji}</span>
      {count > 0 && <span className="font-medium">{count}</span>}
    </Button>
  )
}

interface ReactionPickerProps {
  pinId: string
  onReactionSelect: (reactionType: ReactionType) => void
}

function ReactionPicker({ pinId, onReactionSelect }: ReactionPickerProps) {
  const { getUserReactions } = useReactionsStore()
  const userReactions = getUserReactions(pinId)

  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {(Object.keys(REACTION_CONFIG) as ReactionType[]).map(reactionType => {
        const config = REACTION_CONFIG[reactionType]
        const hasReacted = userReactions.includes(reactionType)
        
        return (
          <Button
            key={reactionType}
            variant={hasReacted ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onReactionSelect(reactionType)}
            className={`
              flex flex-col items-center p-3 h-auto
              ${hasReacted ? 'border-2' : 'border'}
              transition-all duration-200 hover:scale-105
            `}
            style={{
              borderColor: hasReacted ? config.color : undefined,
              backgroundColor: hasReacted ? `${config.color}20` : undefined,
              color: hasReacted ? config.color : undefined
            }}
          >
            <span className="text-lg mb-1">{config.emoji}</span>
            <span className="text-xs font-medium">{config.label}</span>
          </Button>
        )
      })}
    </div>
  )
}

export default function Reactions({ pinId, showAddButton = true, size = 'md' }: ReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)
  const { 
    getReactionCounts, 
    hasUserReacted, 
    toggleReaction, 
    fetchReactions,
    isLoading,
    error 
  } = useReactionsStore()

  const counts = getReactionCounts(pinId)

  useEffect(() => {
    fetchReactions(pinId)
  }, [pinId, fetchReactions])

  const handleReactionClick = async (reactionType: ReactionType) => {
    await toggleReaction(pinId, reactionType)
  }

  const handleReactionSelect = async (reactionType: ReactionType) => {
    await toggleReaction(pinId, reactionType)
    setShowPicker(false)
  }

  // Get the most popular reactions to display
  const popularReactions = (Object.keys(REACTION_CONFIG) as ReactionType[])
    .filter(type => counts[type] > 0)
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, 4) // Show top 4 reactions

  // Always show 'like' if no reactions exist
  const reactionsToShow = popularReactions.length > 0 ? popularReactions : ['like' as ReactionType]

  if (isLoading && counts.total === 0) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-pulse flex space-x-2">
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Display popular reactions */}
      {reactionsToShow.map(reactionType => (
        <ReactionButton
          key={reactionType}
          pinId={pinId}
          reactionType={reactionType}
          count={counts[reactionType]}
          hasReacted={hasUserReacted(pinId, reactionType)}
          size={size}
          onClick={() => handleReactionClick(reactionType)}
        />
      ))}

      {/* Add reaction button */}
      {showAddButton && (
        <Popover open={showPicker} onOpenChange={setShowPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`
                ${size === 'sm' ? 'px-2 py-1' : size === 'lg' ? 'px-4 py-2' : 'px-3 py-1.5'}
                border border-dashed border-gray-300 hover:border-gray-400
                transition-all duration-200 hover:scale-105
              `}
            >
              <Plus className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="p-3 border-b">
              <h4 className="font-medium text-sm text-gray-900">Choose a reaction</h4>
            </div>
            <ReactionPicker pinId={pinId} onReactionSelect={handleReactionSelect} />
          </PopoverContent>
        </Popover>
      )}

      {/* Total count display */}
      {counts.total > 0 && (
        <span className="text-sm text-gray-500 ml-2">
          {counts.total} {counts.total === 1 ? 'reaction' : 'reactions'}
        </span>
      )}

      {/* Error display */}
      {error && (
        <span className="text-xs text-red-500 ml-2">
          {error}
        </span>
      )}
    </div>
  )
}

// Simple like button for backward compatibility
interface LikeButtonProps {
  pinId: string
  size?: 'sm' | 'md' | 'lg'
}

export function LikeButton({ pinId, size = 'md' }: LikeButtonProps) {
  const { getReactionCounts, hasUserReacted, toggleReaction } = useReactionsStore()
  const counts = getReactionCounts(pinId)
  const hasLiked = hasUserReacted(pinId, 'like')

  const handleClick = () => {
    toggleReaction(pinId, 'like')
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center space-x-1 transition-colors
        ${hasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}
      `}
    >
      <Heart className={`${sizeClasses[size]} ${hasLiked ? 'fill-current' : ''}`} />
      <span className="text-sm font-medium">{counts.like}</span>
    </button>
  )
}
