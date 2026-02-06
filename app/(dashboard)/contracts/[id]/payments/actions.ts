"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// Helper function to get current staff ID from auth user
async function getCurrentStaffId() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized: User not logged in")
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (!staff) {
    throw new Error("Staff not found for current user")
  }

  return staff.id
}

// Helper function to log activity
async function logActivity(
  staffId: string,
  contractId: string,
  action: string,
  note?: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from("activity_logs").insert({
    staff_id: staffId,
    contract_id: contractId,
    action,
    note,
  })

  if (error) {
    console.error("Error logging activity:", error)
  }
}

export interface PaymentData {
  paymentType: "INTEREST" | "PARTIAL" | "FULL_REDEEM" | "EXTENSION_FEE" | "PENALTY" | "OTHER"
  paymentMethod: "CASH" | "BANK_TRANSFER" | "OTHER"
  amount: number
  interestAmount?: number
  principalAmount?: number
  penaltyAmount?: number
  notes?: string
  receiptNumber?: string
}

/**
 * Record a payment for a contract
 * Inserts to contract_payments table
 * Updates contracts.outstanding_balance
 * Logs activity 'PAYMENT_RECEIVED'
 */
export async function recordPayment(contractId: string, paymentData: PaymentData) {
  try {
    const staffId = await getCurrentStaffId()
    const supabase = await createClient()

    // Validate amount
    if (paymentData.amount <= 0) {
      throw new Error("Payment amount must be greater than 0")
    }

    // Get current contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status, outstanding_balance, total_amount_paid, total_interest_paid")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      throw new Error("Contract not found")
    }

    // Only allow payments for ACTIVE, EXTENDED, or OVERDUE contracts
    const allowedStatuses = ["ACTIVE", "EXTENDED", "OVERDUE"]
    if (!allowedStatuses.includes(contract.status)) {
      throw new Error(
        `Cannot record payment for contract with status: ${contract.status}`
      )
    }

    const today = new Date().toISOString().split("T")[0]

    // Insert payment record
    const { data: payment, error: paymentError } = await supabase
      .from("contract_payments")
      .insert({
        contract_id: contractId,
        payment_type: paymentData.paymentType,
        payment_method: paymentData.paymentMethod,
        amount: paymentData.amount,
        interest_amount: paymentData.interestAmount || 0,
        principal_amount: paymentData.principalAmount || 0,
        penalty_amount: paymentData.penaltyAmount || 0,
        payment_date: today,
        received_by: staffId,
        notes: paymentData.notes,
        receipt_number: paymentData.receiptNumber,
      })
      .select()
      .single()

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`)
    }

    // Calculate new outstanding balance
    const principalPaid = paymentData.principalAmount || 0
    const newOutstandingBalance = Math.max(
      0,
      (contract.outstanding_balance || 0) - principalPaid
    )

    // Calculate new totals
    const newTotalAmountPaid = (contract.total_amount_paid || 0) + paymentData.amount
    const newTotalInterestPaid =
      (contract.total_interest_paid || 0) + (paymentData.interestAmount || 0)

    // Update contract balance
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        outstanding_balance: newOutstandingBalance,
        total_amount_paid: newTotalAmountPaid,
        total_interest_paid: newTotalInterestPaid,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      throw new Error(`Failed to update contract balance: ${updateError.message}`)
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

    await logActivity(
      staffId,
      contractId,
      "PAYMENT_RECEIVED",
      `${paymentTypeNames[paymentData.paymentType] || paymentData.paymentType}: ${paymentData.amount.toLocaleString("vi-VN")} VND`
    )

    revalidatePath(`/contracts/${contractId}`)

    return { success: true, payment }
  } catch (error) {
    console.error("Error recording payment:", error)
    throw error
  }
}

/**
 * Get all payments for a contract
 */
export async function getContractPayments(contractId: string) {
  try {
    const supabase = await createClient()

    const { data: payments, error } = await supabase
      .from("contract_payments")
      .select(`
        *,
        received_by_staff:staff(full_name)
      `)
      .eq("contract_id", contractId)
      .order("payment_date", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch payments: ${error.message}`)
    }

    return { success: true, payments: payments || [] }
  } catch (error) {
    console.error("Error fetching payments:", error)
    throw error
  }
}

/**
 * Delete a payment record (only for recent payments, admin only)
 */
export async function deletePayment(contractId: string, paymentId: string) {
  try {
    const staffId = await getCurrentStaffId()
    const supabase = await createClient()

    // Get payment details first
    const { data: payment, error: paymentError } = await supabase
      .from("contract_payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      throw new Error("Payment not found")
    }

    // Get current contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("outstanding_balance, total_amount_paid, total_interest_paid")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      throw new Error("Contract not found")
    }

    // Delete payment
    const { error: deleteError } = await supabase
      .from("contract_payments")
      .delete()
      .eq("id", paymentId)

    if (deleteError) {
      throw new Error(`Failed to delete payment: ${deleteError.message}`)
    }

    // Revert contract balance
    const newOutstandingBalance =
      (contract.outstanding_balance || 0) + (payment.principal_amount || 0)
    const newTotalAmountPaid =
      (contract.total_amount_paid || 0) - payment.amount
    const newTotalInterestPaid =
      (contract.total_interest_paid || 0) - (payment.interest_amount || 0)

    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        outstanding_balance: Math.max(0, newOutstandingBalance),
        total_amount_paid: Math.max(0, newTotalAmountPaid),
        total_interest_paid: Math.max(0, newTotalInterestPaid),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      throw new Error(`Failed to update contract balance: ${updateError.message}`)
    }

    // Log activity
    await logActivity(
      staffId,
      contractId,
      "PAYMENT_RECEIVED",
      `Xóa phiếu thu: ${payment.amount.toLocaleString("vi-VN")} VND`
    )

    revalidatePath(`/contracts/${contractId}`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting payment:", error)
    throw error
  }
}
