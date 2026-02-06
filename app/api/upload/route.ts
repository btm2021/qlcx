import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/upload
 * Upload file to Supabase Storage
 * Returns public URL
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get staff ID
    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()

    if (!staff) {
      return NextResponse.json(
        { error: "Staff not found" },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const bucket = formData.get("bucket") as string || "contract-images"
    const path = formData.get("path") as string
    const contractId = formData.get("contract_id") as string
    const imageType = formData.get("image_type") as string || "OTHER"

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, PDF" },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Max size: 5MB" },
        { status: 400 }
      )
    }

    // Generate file path if not provided
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = path ? `${path}/${fileName}` : fileName

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    // If contract_id is provided, save to contract_images table
    if (contractId) {
      const { error: dbError } = await supabase.from("contract_images").insert({
        contract_id: contractId,
        image_type: imageType,
        file_path: publicUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: staff.id,
      })

      if (dbError) {
        console.error("Database error:", dbError)
        // Don't fail the upload if DB insert fails, just log it
      }

      // Log activity
      await supabase.from("activity_logs").insert({
        staff_id: staff.id,
        contract_id: contractId,
        action: "PHOTO_UPLOADED",
        note: `Upload ảnh: ${file.name}`,
      })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/upload
 * Delete file from Supabase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse request body
    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get("bucket") || "contract-images"
    const path = searchParams.get("path")

    if (!path) {
      return NextResponse.json(
        { error: "Path is required" },
        { status: 400 }
      )
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return NextResponse.json(
        { error: `Failed to delete file: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    )
  }
}
