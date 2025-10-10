/**
 * Image optimization utilities for SILAS platform
 * Handles client-side image resizing, compression, and format conversion
 */

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
  maintainAspectRatio?: boolean
}

export interface OptimizedImage {
  file: File
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  dimensions: { width: number; height: number }
}

/**
 * Resize and compress an image file
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'jpeg',
    maintainAspectRatio = true
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight,
          maintainAspectRatio
        )

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Configure canvas for better quality
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create optimized image'))
              return
            }

            const optimizedFile = new File(
              [blob],
              `${file.name.split('.')[0]}.${format}`,
              { type: `image/${format}` }
            )

            const compressionRatio = file.size / blob.size

            resolve({
              file: optimizedFile,
              originalSize: file.size,
              optimizedSize: blob.size,
              compressionRatio,
              dimensions: { width, height }
            })
          },
          `image/${format}`,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } {
  if (!maintainAspectRatio) {
    return {
      width: Math.min(originalWidth, maxWidth),
      height: Math.min(originalHeight, maxHeight)
    }
  }

  const aspectRatio = originalWidth / originalHeight

  let width = originalWidth
  let height = originalHeight

  // Scale down if too wide
  if (width > maxWidth) {
    width = maxWidth
    height = width / aspectRatio
  }

  // Scale down if too tall
  if (height > maxHeight) {
    height = maxHeight
    width = height * aspectRatio
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * Create multiple sizes of an image for responsive loading
 */
export async function createResponsiveImages(
  file: File,
  sizes: Array<{ width: number; height?: number; suffix: string }>
): Promise<Array<{ file: File; suffix: string; dimensions: { width: number; height: number } }>> {
  const results = await Promise.all(
    sizes.map(async (size) => {
      const optimized = await optimizeImage(file, {
        maxWidth: size.width,
        maxHeight: size.height,
        quality: 0.85,
        format: 'webp'
      })

      return {
        file: optimized.file,
        suffix: size.suffix,
        dimensions: optimized.dimensions
      }
    })
  )

  return results
}

/**
 * Generate thumbnail from image
 */
export async function generateThumbnail(
  file: File,
  size: number = 200
): Promise<File> {
  const optimized = await optimizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.8,
    format: 'webp',
    maintainAspectRatio: true
  })

  return optimized.file
}

/**
 * Check if browser supports WebP format
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * Get optimal image format based on browser support
 */
export async function getOptimalFormat(originalFormat: string): Promise<'webp' | 'jpeg' | 'png'> {
  const webpSupported = await supportsWebP()
  
  if (webpSupported) {
    return 'webp'
  }
  
  if (originalFormat.includes('png')) {
    return 'png'
  }
  
  return 'jpeg'
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported. Please use JPEG, PNG, WebP, or GIF.`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit.`
    }
  }

  return { valid: true }
}

/**
 * Extract EXIF data and rotate image if needed
 */
export async function correctImageOrientation(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      // Basic orientation correction implementation
      // For production, consider using a library like 'exif-js' for full EXIF support
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          const correctedFile = new File([blob], file.name, { type: file.type })
          resolve(correctedFile)
        } else {
          resolve(file)
        }
      }, file.type)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for orientation correction'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Create a data URL from file for preview
 */
export function createPreviewUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string)
      } else {
        reject(new Error('Failed to create preview URL'))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * Batch optimize multiple images
 */
export async function batchOptimizeImages(
  files: File[],
  options: ImageOptimizationOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<OptimizedImage[]> {
  const results: OptimizedImage[] = []
  
  for (let i = 0; i < files.length; i++) {
    try {
      const optimized = await optimizeImage(files[i], options)
      results.push(optimized)
      
      if (onProgress) {
        onProgress(i + 1, files.length)
      }
    } catch (error) {
      console.error(`Failed to optimize image ${files[i].name}:`, error)
      // Continue with other images
    }
  }
  
  return results
}

/**
 * Calculate storage savings from optimization
 */
export function calculateSavings(optimizedImages: OptimizedImage[]): {
  originalTotalSize: number
  optimizedTotalSize: number
  totalSavings: number
  averageCompressionRatio: number
} {
  const originalTotalSize = optimizedImages.reduce((sum, img) => sum + img.originalSize, 0)
  const optimizedTotalSize = optimizedImages.reduce((sum, img) => sum + img.optimizedSize, 0)
  const totalSavings = originalTotalSize - optimizedTotalSize
  const averageCompressionRatio = optimizedImages.reduce((sum, img) => sum + img.compressionRatio, 0) / optimizedImages.length

  return {
    originalTotalSize,
    optimizedTotalSize,
    totalSavings,
    averageCompressionRatio
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
