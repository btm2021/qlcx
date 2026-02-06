import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/contracts/[id]/payments
 * List all payments for contract
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify contract exists
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id")
      .eq("id", id)
      .single()

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      )
    }

    // Fetch payments
    const { data: payments, error } = await supabase
      .from("contract_payments")
      .select(`
        *,
        received_by_staff:staff(full_name)
      `)
      .eq("contract_id", id)
      .order("payment_date", { ascending: false })

    if (error) {
      throw error
    }

    // Calculate summary
    const summary = {
      totalPayments: payments?.length || 0,
      totalAmount: payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      totalInterest: payments?.reduce((sum, p) => sum + (p.interest_amount || 0), 0) || 0,
      totalPrincipal: payments?.reduce((sum, p) => sum + (p.principal_amount || 0), 0) || 0,
      totalPenalty: payments?.reduce((sum, p) => sum + (p.penalty_amount || 0), 0) || 0,
    }

    return NextResponse.json({
      payments: payments || [],
      summary,
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/contracts/[id]/payments
 * Create new payment
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Get contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status, outstanding_balance, total_amount_paid, total_interest_paid")
      .eq("id", id)
      .single()

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      )
    }

    // Only allow payments for active contracts
    const allowedStatuses = ["ACTIVE", "EXTENDED", "OVERDUE"]
    if (!allowedStatuses.includes(contract.status)) {
      return NextResponse.json(
        { error: `Cannot record payment for contract with status: ${contract.status}` },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      payment_type,
      payment_method,
      amount,
      interest_amount,
      principal_amount,
      penalty_amount,
      payment_date,
      notes,
      receipt_number,
    } = body

    // Validate required fields
    if (!payment_type || !payment_method || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      )
    }

    const today = new Date().toISOString().split("T")[0]

    // Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from("contract_payments")
      .insert({
        contract_id: id,
        payment_type,
        payment_method,
        amount,
        interest_amount: interest_amount || 0,
        principal_amount: principal_amount || 0,
        penalty_amount: penalty_amount || 0,
        payment_date: payment_date || today,
        received_by: staff.id,
        notes,
        receipt_number,
      })
      .select(`
        *,
        received_by_staff:staff(full_name)
      `)
      .single()

    if (paymentError) {
      throw paymentError
    }

    // Update contract balance
    const newOutstandingBalance = Math.max(
      0,
      (contract.outstanding_balance || 0) - (principal_amount || 0)
    )
    const newTotalAmountPaid = (contract.total_amount_paid || 0) + amount
    const newTotalInterestPaid =
      (contract.total_interest_paid || 0) + (interest_amount || 0)

    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        outstanding_balance: newOutstandingBalance,
        total_amount_paid: newTotalAmountPaid,
        total_interest_paid: newTotalInterestPaid,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      throw updateError
    }

    // Log activity
    const paymentTypeNames: Record<string, string> = {
      INTEREST: "Trả lãi",
      PARTIAL: "Trả một phần gốc",
      FULL_REDEEM: "Chuộc toàn bộ",
      EXTENSION_FEE: "Phí gia hạn",
      PENALTY: "Phí phạt",
      OTHER: "Khác",
    }

    await supabase.from("activity_logs").insert({
      staff_id: staff.id,
      contract_id: id,
      action: "PAYMENT_RECEIVED",
      note: `${paymentTypeNames[payment_type] || payment_type}: ${amount.toLocaleString("vi-VN")} VND`,
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    )
  }
}
