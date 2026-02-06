'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Camera, X, ImagePlus } from 'lucide-react';

interface CameraCaptureProps {
  onChange: (files: File[]) => void;
  maxPhotos?: number;
  className?: string;
}

interface CapturedImage {
  id: string;
  file: File;
  preview: string;
}

export function CameraCapture({
  onChange,
  maxPhotos = 6,
  className,
}: CameraCaptureProps) {
  const [images, setImages] = useState<CapturedImage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Process selected files
  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newImages: CapturedImage[] = [];
    const remainingSlots = maxPhotos - images.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({
        id: generateId(),
        file,
        preview,
      });
    });

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages].slice(0, maxPhotos);
      setImages(updatedImages);
      onChange(updatedImages.map((img) => img.file));
    }
  }, [images, maxPhotos, onChange]);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset input so same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Remove image
  const removeImage = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    setImages(updatedImages);
    onChange(updatedImages.map((img) => img.file));
  };

  // Open camera/file picker
  const openCamera = () => {
    inputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={image.preview}
                alt={`Captured ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Image number badge */}
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Photo Button */}
      {images.length < maxPhotos && (
        <Button
          type="button"
          variant="outline"
          onClick={openCamera}
          className="w-full h-24 border-dashed"
        >
          <div className="flex flex-col items-center gap-2">
            {images.length === 0 ? (
              <>
                <Camera className="w-6 h-6" />
                <span className="text-sm">Take Photo</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-5 h-5" />
                <span className="text-sm">
                  Add Photo ({images.length}/{maxPhotos})
                </span>
              </>
            )}
          </div>
        </Button>
      )}

      {/* Photo count indicator */}
      {images.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {images.length} photo{images.length !== 1 ? 's' : ''} captured
          {images.length >= maxPhotos && ' (max reached)'}
        </p>
      )}

      {/* Tips */}
      {images.length === 0 && (
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Tips for good inspection photos:</p>
          <ul className="list-disc list-inside pl-2 space-y-0.5">
            <li>Capture the entire asset</li>
            <li>Include the QR code label</li>
            <li>Take photos from multiple angles</li>
            <li>Ensure good lighting</li>
          </ul>
        </div>
      )}
    </div>
  );
}
