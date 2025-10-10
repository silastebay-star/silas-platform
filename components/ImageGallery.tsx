'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, Download, Share2, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FocusManager, AriaUtils } from '@/lib/accessibility'

interface ImageGalleryProps {
  images: string[]
  thumbnails?: string[]
  alt?: string
  className?: string
}

interface LightboxProps {
  images: string[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate: (index: number) => void
  alt?: string
}

import Image from 'next/image'

// ... existing imports ...

function Lightbox({ images, currentIndex, isOpen, onClose, onNavigate, alt }: LightboxProps) {
  // ... existing state and effects ...

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* Image */}
      <div
        className="relative max-w-full max-h-full overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <Image
          src={images[currentIndex]}
          alt={alt ? `${alt} - Image ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
          fill
          className="object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transformOrigin: 'center center'
          }}
          draggable={false}
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/50 rounded-lg p-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => onNavigate(index)}
              className={`
                w-12 h-12 rounded overflow-hidden border-2 transition-colors
                ${index === currentIndex ? 'border-white' : 'border-transparent hover:border-gray-300'}
              `}
              aria-label={`Go to image ${index + 1}`}
            >
              <Image
                src={image}
                alt=""
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ImageGallery({ images, thumbnails, alt, className = '' }: ImageGalleryProps) {
  // ... existing JSX ...

  // Single image layout
  if (images.length === 1) {
    return (
      <>
        <div className={`relative ${className}`}>
          <button
            onClick={() => openLightbox(0)}
            className="block w-full focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg overflow-hidden group"
            aria-label={`View ${alt || 'image'} in lightbox`}
          >
            <Image
              src={thumbnails?.[0] || images[0]}
              alt={alt || 'Pin image'}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors duration-200 flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </div>
          </button>
        </div>

        <Lightbox
          images={images}
          currentIndex={currentIndex}
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          onNavigate={navigateToImage}
          alt={alt}
        />
      </>
    )
  }

  // Multiple images layout
  return (
    <>
      <div className={`grid gap-2 ${className}`}>
        {/* Main image */}
        <button
          onClick={() => openLightbox(0)}
          className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 group"
          aria-label={`View ${alt || 'image'} 1 of ${images.length} in lightbox`}
        >
          <Image
            src={thumbnails?.[0] || images[0]}
            alt={alt ? `${alt} - Main image` : 'Main pin image'}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors duration-200 flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
          {images.length > 1 && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              +{images.length - 1} more
            </div>
          )}
        </button>

        {/* Thumbnail grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {images.slice(1, 5).map((image, index) => (
              <button
                key={index + 1}
                onClick={() => openLightbox(index + 1)}
                className="relative aspect-square bg-gray-100 rounded overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 group"
                aria-label={`View ${alt || 'image'} ${index + 2} of ${images.length} in lightbox`}
              >
                <Image
                  src={thumbnails?.[index + 1] || image}
                  alt={alt ? `${alt} - Thumbnail ${index + 2}` : `Pin image ${index + 2}`}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-colors duration-200" />
                {index === 3 && images.length > 5 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm font-medium">
                    +{images.length - 5}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <Lightbox
        images={images}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNavigate={navigateToImage}
        alt={alt}
      />
    </>
  )
}
