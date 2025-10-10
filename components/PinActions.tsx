'use client'

import { useState } from 'react'
import { Edit, Trash2, Flag, Share2, Archive, Eye, EyeOff, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { usePinsStore, type Pin } from '@/store/pins'

interface PinActionsProps {
  pin: Pin
  onEdit?: () => void
  onClose?: () => void
  currentUserId?: string
  isAdmin?: boolean
}

export default function PinActions({ pin, onEdit, onClose, currentUserId, isAdmin = false }: PinActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { updatePin, deletePin } = usePinsStore()

  const isOwner = currentUserId === pin.created_by
  const canEdit = isOwner || isAdmin
  const canDelete = isOwner || isAdmin
  const canModerate = isAdmin

  const handleShare = async () => {
    const shareData = {
      title: pin.title,
      text: pin.description || '',
      url: `${window.location.origin}/pin/${pin.id}`
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // User cancelled or error occurred, fall back to clipboard
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/pin/${pin.id}`
    navigator.clipboard.writeText(url).then(() => {
      // TODO: Show toast notification
      console.log('Link copied to clipboard')
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      console.log('Link copied to clipboard (fallback)')
    })
  }

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      await deletePin(pin.id)
      setShowDeleteDialog(false)
      onClose?.()
    } catch (error) {
      console.error('Failed to delete pin:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleArchive = async () => {
    setIsSubmitting(true)
    try {
      await updatePin(pin.id, { status: 'archived' })
      setShowArchiveDialog(false)
      onClose?.()
    } catch (error) {
      console.error('Failed to archive pin:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason.trim()) return

    setIsSubmitting(true)
    try {
      // TODO: Implement reporting system
      console.log('Reporting pin:', pin.id, 'Reason:', reportReason)
      
      // For now, just flag the pin if admin
      if (canModerate) {
        await updatePin(pin.id, { status: 'flagged' })
      }
      
      setShowReportDialog(false)
      setReportReason('')
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to report pin:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleVisibility = async () => {
    const newStatus = pin.status === 'active' ? 'archived' : 'active'
    try {
      await updatePin(pin.id, { status: newStatus })
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="">
          {/* Share */}
          <DropdownMenuItem onClick={handleShare} className="" inset={false}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </DropdownMenuItem>

          {/* Edit (owner or admin) */}
          {canEdit && (
            <DropdownMenuItem onClick={onEdit} className="" inset={false}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {/* Moderation actions */}
          {canModerate && (
            <>
              <DropdownMenuSeparator className="" />
              
              <DropdownMenuItem onClick={handleToggleVisibility} className="" inset={false}>
                {pin.status === 'active' ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Show
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setShowArchiveDialog(true)} className="" inset={false}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </>
          )}

          {/* Report */}
          {!isOwner && (
            <>
              <DropdownMenuSeparator className="" />
              <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="text-orange-600" inset={false}>
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
            </>
          )}

          {/* Delete (owner or admin) */}
          {canDelete && (
            <>
              <DropdownMenuSeparator className="" />
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600" inset={false}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="">
          <DialogHeader className="">
            <DialogTitle className="">Delete Pin</DialogTitle>
            <DialogDescription className="">
              Are you sure you want to delete &quot;{pin.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)} className="">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isSubmitting}
              className=""
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent className="">
          <DialogHeader className="">
            <DialogTitle className="">Archive Pin</DialogTitle>
            <DialogDescription className="">
              Are you sure you want to archive &quot;{pin.title}&quot;? It will be hidden from public view but can be restored later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="">
            <Button variant="outline" size="sm" onClick={() => setShowArchiveDialog(false)} className="">
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleArchive}
              disabled={isSubmitting}
              className=""
            >
              {isSubmitting ? 'Archiving...' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="">
          <DialogHeader className="">
            <DialogTitle className="">Report Pin</DialogTitle>
            <DialogDescription className="">
              Please describe why you&apos;re reporting this pin. Our moderation team will review it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the issue..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter className="">
            <Button variant="outline" size="sm" onClick={() => setShowReportDialog(false)} className="">
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleReport}
              disabled={!reportReason.trim() || isSubmitting}
              className=""
            >
              {isSubmitting ? 'Reporting...' : 'Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
