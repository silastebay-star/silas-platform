'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { handleError } from '@/lib/error-handling'
import Image from 'next/image'

interface ImageFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  progress: number
  url?: string
  error?: string
}

interface ImageUploadProps {
  onImagesChange: (urls: string[]) => void
  maxImages?: number
  maxSizeBytes?: number
  acceptedTypes?: string[]
  existingImages?: string[]
  disabled?: boolean
  authorId: string // New prop for author ID
}

export default function ImageUpload({
  onImagesChange,
  maxImages = 5,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  existingImages = [],
  disabled = false,
  authorId
}: ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate unique filename for upload
  const generateFileName = (file: File): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    const extension = file.name.split('.').pop()
    return `${timestamp}-${random}.${extension}`
  }

  // Validate file
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported. Please use ${acceptedTypes.join(', ')}.`
    }
    
    if (file.size > maxSizeBytes) {
      const maxSizeMB = maxSizeBytes / (1024 * 1024)
      return `File size exceeds ${maxSizeMB}MB limit.`
    }
    
    return null
  }

  // Upload file to Supabase Storage
  const uploadFile = async (imageFile: ImageFile): Promise<string> => {
    const fileName = generateFileName(imageFile.file)
    const filePath = `${authorId}/${Date.now()}/${fileName}` // Use authorId as folder for organization
    
    const { data, error } = await supabase.storage
      .from('pin-photos')
      .upload(filePath, imageFile.file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw handleError(error, 'ImageUpload - uploadFile', false) // Don't show toast here, handled by component
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pin-photos')
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }

  // Handle file selection
  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const totalImages = images.length + existingImages.length + fileArray.length
    
    if (totalImages > maxImages) {
      handleError(`Maximum ${maxImages} images allowed`, 'ImageUpload - handleFiles', true)
      return
    }

    const newImages: ImageFile[] = fileArray.map(file => {
      const validation = validateFile(file)
      return {
        id: Math.random().toString(36).substring(2),
        file,
        preview: URL.createObjectURL(file),
        status: validation ? 'error' : 'pending',
        progress: 0,
        error: validation || undefined
      }
    })

    setImages(prev => [...prev, ...newImages])

    // Start uploading valid files
    newImages.forEach(async (imageFile) => {
      if (imageFile.status === 'pending') {
        setImages(prev => prev.map(img => 
          img.id === imageFile.id 
            ? { ...img, status: 'uploading', progress: 0 }
            : img
        ))

        try {
          const url = await uploadFile(imageFile)
          
          setImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { ...img, status: 'uploaded', progress: 100, url }
              : img
          ))

          // Update parent component
          const allUrls = [...existingImages]
          setImages(current => {
            const uploadedUrls = current
              .filter(img => img.status === 'uploaded' && img.url)
              .map(img => img.url!)
            onImagesChange([...allUrls, ...uploadedUrls])
            return current
          })

        } catch (error: any) {
          setImages(prev => prev.map(img => 
            img.id === imageFile.id 
              ? { 
                  ...img, 
                  status: 'error', 
                  error: error instanceof Error ? error.message : 'Upload failed' 
                }
              : img
          ))
          handleError(error, 'ImageUpload - uploadFile catch', true)
        }
      }
    })
  }, [images, existingImages, maxImages, onImagesChange, authorId])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [disabled, handleFiles])

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [handleFiles])

  // Remove image
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
      
      // Update parent component with remaining URLs
      const uploadedUrls = updated
        .filter(img => img.status === 'uploaded' && img.url)
        .map(img => img.url!)
      onImagesChange([...existingImages, ...uploadedUrls])
      
      return updated
    })
  }, [existingImages, onImagesChange])

  // Remove existing image
  const removeExistingImage = useCallback((url: string) => {
    const updatedExisting = existingImages.filter(img => img !== url)
    const uploadedUrls = images
      .filter(img => img.status === 'uploaded' && img.url)
      .map(img => img.url!)
    onImagesChange([...updatedExisting, ...uploadedUrls])
  }, [existingImages, images, onImagesChange])

  const canAddMore = images.length + existingImages.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && !disabled && (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${isDragOver 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            Drag and drop images here, or click to select
          </p>
          <p className="text-xs text-gray-500">
            {acceptedTypes.join(', ')} up to {Math.round(maxSizeBytes / (1024 * 1024))}MB each
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {maxImages - images.length - existingImages.length} more images allowed
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {existingImages.map((url, index) => (
            <div key={`existing-${index}`} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={url}
                  alt={`Existing image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeExistingImage(url)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={image.preview}
                  alt="Upload preview"
                  fill
                  className="object-cover"
                />
                
                {/* Status Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  {image.status === 'uploading' && (
                    <div className="text-white text-center">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                      <div className="text-xs">{Math.round(image.progress)}%</div>
                    </div>
                  )}
                  
                  {image.status === 'uploaded' && (
                    <Check className="w-8 h-8 text-green-500" />
                  )}
                  
                  {image.status === 'error' && (
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  )}
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(image.id)}
              >
                <X className="w-3 h-3" />
              </Button>

              {/* Error Message */}
              {image.error && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1 rounded-b-lg">
                  {image.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && existingImages.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}
