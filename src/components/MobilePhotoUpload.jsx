import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, Check, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MobilePhotoUpload = ({ 
  onPhotoCapture, 
  onPhotoUpload, 
  onCancel, 
  isOpen,
  maxPhotos = 5,
  existingPhotos = []
}) => {
  const [photos, setPhotos] = useState(existingPhotos);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' for front, 'environment' for back
  const [uploadProgress, setUploadProgress] = useState({});
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      setIsCapturing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const photoData = {
          id: Date.now(),
          blob: blob,
          url: URL.createObjectURL(blob),
          type: 'camera',
          timestamp: new Date().toISOString(),
          size: blob.size
        };
        
        setPhotos(prev => [...prev, photoData]);
        setCurrentPhoto(photoData);
        stopCamera();

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 'image/jpeg', 0.8);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach((file, index) => {
      if (photos.length + index >= maxPhotos) return;
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select only image files');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      const photoData = {
        id: Date.now() + index,
        blob: file,
        url: URL.createObjectURL(file),
        type: 'upload',
        timestamp: new Date().toISOString(),
        size: file.size,
        name: file.name
      };

      setPhotos(prev => [...prev, photoData]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove photo
  const removePhoto = (photoId) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== photoId);
      // Cleanup object URLs
      const removed = prev.find(p => p.id === photoId);
      if (removed?.url) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });

    if (currentPhoto?.id === photoId) {
      setCurrentPhoto(null);
    }
  };

  // Switch camera (front/back)
  const switchCamera = () => {
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (isCapturing) {
      stopCamera();
      setTimeout(() => {
        setFacingMode(newFacingMode);
        startCamera();
      }, 100);
    }
  };

  // Upload photos to server
  const uploadPhotos = async () => {
    if (photos.length === 0) return;

    try {
      const uploadPromises = photos.map(async (photo) => {
        setUploadProgress(prev => ({ ...prev, [photo.id]: 0 }));

        // Simulate upload progress (replace with actual upload logic)
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadProgress(prev => ({ ...prev, [photo.id]: progress }));
        }

        return {
          id: photo.id,
          url: photo.url, // This would be the server URL
          uploaded: true
        };
      });

      const results = await Promise.all(uploadPromises);
      
      if (onPhotoUpload) {
        onPhotoUpload(results);
      }

      // Reset state
      setPhotos([]);
      setCurrentPhoto(null);
      setUploadProgress({});
      
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos. Please try again.');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      // Cleanup object URLs
      photos.forEach(photo => {
        if (photo.url) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, []);

  // Stop camera when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4">
        <div className="flex items-center justify-between text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold">Add Photos</h2>
          <div className="text-sm">
            {photos.length}/{maxPhotos}
          </div>
        </div>
      </div>

      {/* Camera View */}
      {isCapturing && (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Camera Controls */}
          <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-8">
            {/* Gallery Button */}
            <Button
              variant="ghost"
              size="lg"
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <ImageIcon className="h-6 w-6" />
            </Button>

            {/* Capture Button */}
            <Button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-white shadow-lg hover:bg-gray-100"
            >
              <div className="w-full h-full rounded-full bg-white"></div>
            </Button>

            {/* Switch Camera Button */}
            <Button
              variant="ghost"
              size="lg"
              onClick={switchCamera}
              className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Photo Gallery View */}
      {!isCapturing && (
        <div className="flex flex-col h-full pt-16 pb-4">
          {/* Photo Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {photos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white">
                <Camera className="h-16 w-16 mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No photos yet</h3>
                <p className="text-sm opacity-75 text-center">
                  Take photos or upload from your gallery
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <img
                      src={photo.url}
                      alt="Captured"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    
                    {/* Upload Progress */}
                    {uploadProgress[photo.id] !== undefined && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-white text-sm">
                          {uploadProgress[photo.id]}%
                        </div>
                      </div>
                    )}

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="p-4 space-y-3">
            <div className="flex space-x-3">
              <Button
                onClick={startCamera}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                disabled={photos.length >= maxPhotos}
              >
                <Camera className="h-5 w-5" />
                Take Photo
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2 text-white border-white hover:bg-white/10"
                disabled={photos.length >= maxPhotos}
              >
                <Upload className="h-5 w-5" />
                Upload
              </Button>
            </div>

            {photos.length > 0 && (
              <Button
                onClick={uploadPhotos}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-5 w-5" />
                Add {photos.length} Photo{photos.length !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Hidden Canvas for Photo Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default MobilePhotoUpload;
