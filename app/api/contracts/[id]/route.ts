import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/contracts/[id]
 * Return contract with customer and vehicle details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Fetch contract with related data
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*),
        vehicle_category:vehicle_categories(*),
        contract_type:contract_types(*),
        creator:staff!contracts_created_by_fkey(full_name),
        receiver:staff!contracts_received_by_fkey(full_name)
      `)
      .eq("id", id)
      .single()

    if (contractError) {
      if (contractError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Contract not found" },
          { status: 404 }
        )
      }
      throw contractError
    }

    // Fetch status history
    const { data: statusHistory } = await supabase
      .from("contract_status_history")
      .select(`
        *,
        changed_by_staff:staff(full_name)
      `)
      .eq("contract_id", id)
      .order("changed_at", { ascending: false })

    // Fetch contract images
    const { data: images } = await supabase
      .from("contract_images")
      .select("*")
      .eq("contract_id", id)
      .order("uploaded_at", { ascending: false })

    // Fetch inspection logs
    const { data: inspections } = await supabase
      .from("inspection_logs")
      .select(`
        *,
        staff:staff(full_name)
      `)
      .eq("contract_id", id)
      .order("inspected_at", { ascending: false })

    // Fetch payments summary
    const { data: payments } = await supabase
      .from("contract_payments")
      .select(`
        *,
        received_by_staff:staff(full_name)
      `)
      .eq("contract_id", id)
      .order("payment_date", { ascending: false })

    return NextResponse.json({
      contract,
      statusHistory: statusHistory || [],
      images: images || [],
      inspections: inspections || [],
      payments: payments || [],
    })
  } catch (error) {
    console.error("Error fetching contract:", error)
    return NextResponse.json(
      { error: "Failed to fetch contract" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/contracts/[id]
 * Update contract (notes, due_date, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Parse request body
    const body = await request.json()
    const { notes, due_date, interest_rate, storage_location } = body

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (notes !== undefined) updateData.notes = notes
    if (due_date !== undefined) updateData.due_date = due_date
    if (interest_rate !== undefined) updateData.interest_rate = interest_rate

    // Update contract
    const { data: contract, error: updateError } = await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Update vehicle storage location if provided
    if (storage_location !== undefined) {
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("id")
        .eq("contract_id", id)
        .single()

      if (vehicle) {
        await supabase
          .from("vehicles")
          .update({ storage_location })
          .eq("id", vehicle.id)
      }
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      staff_id: staff.id,
      contract_id: id,
      action: "STATUS_CHANGED",
      note: "Cập nhật thông tin hợp đồng",
    })

    return NextResponse.json({ contract })
  } catch (error) {
    console.error("Error updating contract:", error)
    return NextResponse.json(
      { error: "Failed to update contract" },
      { status: 500 }
    )
  }
}
