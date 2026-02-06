import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/upload/signed-url
 * Get signed URL for uploading to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      bucket = 'contract-images',
      fileName,
      fileType = 'image/jpeg',
      contractQrCode,
      imageType = 'RECEIVING'
    } = body

    if (!fileName) {
      return NextResponse.json(
        { error: 'fileName is required' },
        { status: 400 }
      )
    }

    // Validate bucket name
    const allowedBuckets = ['contract-images', 'qr-codes', 'customer-documents', 'vehicle-documents']
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: 'Invalid bucket name', allowedBuckets },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type', allowedTypes },
        { status: 400 }
      )
    }

    // Generate storage path based on bucket type
    let path: string
    const timestamp = Date.now()
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')

    switch (bucket) {
      case 'contract-images':
        if (!contractQrCode) {
          return NextResponse.json(
            { error: 'contractQrCode is required for contract-images bucket' },
            { status: 400 }
          )
        }
        path = `${contractQrCode}/${imageType}_${timestamp}_${cleanFileName}`
        break

      case 'qr-codes':
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        path = `${year}/${month}/${day}/${cleanFileName}`
        break

      case 'customer-documents':
        const { customerId } = body
        if (!customerId) {
          return NextResponse.json(
            { error: 'customerId is required for customer-documents bucket' },
            { status: 400 }
          )
        }
        path = `${customerId}/${imageType}_${timestamp}_${cleanFileName}`
        break

      case 'vehicle-documents':
        const { vehicleId } = body
        if (!vehicleId) {
          return NextResponse.json(
            { error: 'vehicleId is required for vehicle-documents bucket' },
            { status: 400 }
          )
        }
        path = `${vehicleId}/${imageType}_${timestamp}_${cleanFileName}`
        break

      default:
        path = `${timestamp}_${cleanFileName}`
    }

    // Create signed URL with 5 minute expiry
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .createSignedUploadUrl(path, {
        upsert: false
      })

    if (error) {
      console.error('Error creating signed URL:', error)
      return NextResponse.json(
        { error: 'Failed to create signed URL', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      bucket,
      token: data.token,
      expiresIn: 300 // 5 minutes in seconds
    })

  } catch (error) {
    console.error('Signed URL error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
