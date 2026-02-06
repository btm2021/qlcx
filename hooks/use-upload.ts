'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  path: string
  url: string
  fileName: string
}

export interface UseUploadReturn {
  uploadFile: (
    file: File,
    options: {
      bucket?: string
      path?: string
      contractQrCode?: string
      imageType?: string
      onProgress?: (progress: UploadProgress) => void
    }
  ) => Promise<UploadResult>
  uploadMultiple: (
    files: File[],
    options: {
      bucket?: string
      contractQrCode?: string
      imageType?: string
      onProgress?: (index: number, progress: UploadProgress) => void
    }
  ) => Promise<UploadResult[]>
  isUploading: boolean
  progress: UploadProgress | null
  error: Error | null
  reset: () => void
}

/**
 * Hook for handling file uploads to Supabase Storage
 * with progress tracking
 */
export function useUpload(): UseUploadReturn {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const reset = useCallback(() => {
    setIsUploading(false)
    setProgress(null)
    setError(null)
  }, [])

  /**
   * Upload a single file
   */
  const uploadFile = useCallback(async (
    file: File,
    options: {
      bucket?: string
      path?: string
      contractQrCode?: string
      imageType?: string
      onProgress?: (progress: UploadProgress) => void
    } = {}
  ): Promise<UploadResult> => {
    const {
      bucket = 'contract-images',
      path,
      contractQrCode,
      imageType = 'OTHER',
      onProgress
    } = options

    setIsUploading(true)
    setError(null)

    try {
      // Validate file
      if (!file) {
        throw new Error('No file provided')
      }

      // Check file size (max 5MB for images)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error(`File size exceeds 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      }

      // Generate path if not provided
      let uploadPath = path
      if (!uploadPath) {
        const timestamp = Date.now()
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')

        if (bucket === 'contract-images' && contractQrCode) {
          uploadPath = `${contractQrCode}/${imageType}_${timestamp}_${cleanFileName}`
        } else {
          const now = new Date()
          const year = now.getFullYear()
          const month = String(now.getMonth() + 1).padStart(2, '0')
          const day = String(now.getDate()).padStart(2, '0')
          uploadPath = `${year}/${month}/${day}/${timestamp}_${cleanFileName}`
        }
      }

      // Get current user for metadata
      const { data: { user } } = await supabase.auth.getUser()

      // Upload with progress tracking
      const { data, error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(uploadPath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          metadata: {
            uploaded_by: user?.id || 'unknown',
            original_name: file.name,
            image_type: imageType
          }
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(data.path)

      const result: UploadResult = {
        path: data.path,
        url: publicUrl,
        fileName: file.name
      }

      // Simulate progress for now (Supabase doesn't support upload progress in JS client)
      // In production, you might use XMLHttpRequest for real progress
      const simulatedProgress: UploadProgress = {
        loaded: file.size,
        total: file.size,
        percentage: 100
      }

      setProgress(simulatedProgress)
      onProgress?.(simulatedProgress)

      return result

    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Upload failed')
      setError(uploadError)
      throw uploadError

    } finally {
      setIsUploading(false)
    }
  }, [supabase])

  /**
   * Upload multiple files
   */
  const uploadMultiple = useCallback(async (
    files: File[],
    options: {
      bucket?: string
      contractQrCode?: string
      imageType?: string
      onProgress?: (index: number, progress: UploadProgress) => void
    } = {}
  ): Promise<UploadResult[]> => {
    const { onProgress, ...restOptions } = options

    setIsUploading(true)
    setError(null)

    try {
      const results: UploadResult[] = []

      for (let i = 0; i < files.length; i++) {
        const result = await uploadFile(files[i], {
          ...restOptions,
          onProgress: (progress) => {
            onProgress?.(i, progress)
          }
        })

        results.push(result)
      }

      return results

    } catch (err) {
      const uploadError = err instanceof Error ? err : new Error('Batch upload failed')
      setError(uploadError)
      throw uploadError

    } finally {
      setIsUploading(false)
    }
  }, [uploadFile])

  return {
    uploadFile,
    uploadMultiple,
    isUploading,
    progress,
    error,
    reset
  }
}

/**
 * Hook for getting signed upload URLs
 * Use this for larger files or when you need more control
 */
export function useSignedUpload() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const getSignedUrl = useCallback(async ({
    bucket = 'contract-images',
    fileName,
    fileType = 'image/jpeg',
    contractQrCode,
    imageType = 'RECEIVING'
  }: {
    bucket?: string
    fileName: string
    fileType?: string
    contractQrCode?: string
    imageType?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucket,
          fileName,
          fileType,
          contractQrCode,
          imageType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get signed URL')
      }

      const data = await response.json()
      return data

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get signed URL')
      setError(error)
      throw error

    } finally {
      setIsLoading(false)
    }
  }, [])

  const uploadWithSignedUrl = useCallback(async (
    file: File,
    signedUrl: string
  ): Promise<void> => {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }
  }, [])

  return {
    getSignedUrl,
    uploadWithSignedUrl,
    isLoading,
    error
  }
}

/**
 * Hook for deleting files from storage
 */
export function useDeleteFile() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClient()

  const deleteFile = useCallback(async (
    path: string,
    bucket: string = 'contract-images'
  ): Promise<void> => {
    setIsDeleting(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .storage
        .from(bucket)
        .remove([path])

      if (deleteError) {
        throw new Error(deleteError.message)
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Delete failed')
      setError(error)
      throw error

    } finally {
      setIsDeleting(false)
    }
  }, [supabase])

  return {
    deleteFile,
    isDeleting,
    error
  }
}
