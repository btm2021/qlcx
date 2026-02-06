"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ContractPayment } from "@/types"

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
    // Don't throw here - logging failure shouldn't break the main operation
  }
}

// Helper function to record status history
async function recordStatusHistory(
  contractId: string,
  oldStatus: string | null,
  newStatus: string,
  staffId: string,
  reason?: string
) {
  const supabase = await createClient()

  const { error } = await supabase.from("contract_status_history").insert({
    contract_id: contractId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: staffId,
    reason,
  })

  if (error) {
    console.error("Error recording status history:", error)
  }
}

/**
 * Receive asset for a contract
 * Updates: is_asset_received = true, received_at = now(), received_by = current staff
 * Logs: ASSET_RECEIVED activity
 */
export async function receiveAsset(contractId: string) {
  try {
    const staffId = await getCurrentStaffId()
    const supabase = await createClient()

    // Get current contract status
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      throw new Error("Contract not found")
    }

    // Only allow receiving asset for ACTIVE, EXTENDED, or OVERDUE contracts
    const allowedStatuses = ["ACTIVE", "EXTENDED", "OVERDUE"]
    if (!allowedStatuses.includes(contract.status)) {
      throw new Error(
        `Cannot receive asset for contract with status: ${contract.status}`
      )
    }

    // Update contract
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        is_asset_received: true,
        received_at: new Date().toISOString(),
        received_by: staffId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      throw new Error(`Failed to update contract: ${updateError.message}`)
    }

    // Log activity
    await logActivity(staffId, contractId, "ASSET_RECEIVED", "Tài sản đã được tiếp nhận vào kho")

    revalidatePath(`/contracts/${contractId}`)

    return { success: true }
  } catch (error) {
    console.error("Error receiving asset:", error)
    throw error
  }
}

/**
 * Extend contract due date
 * Updates: due_date += extensionDays, status = 'EXTENDED', extension_count++
 * Logs: CONTRACT_EXTENDED activity and status history
 */
export async function extendContract(contractId: string, extensionDays: number) {
  try {
    const staffId = await getCurrentStaffId()
    const supabase = await createClient()

    // Validate extension days
    if (extensionDays <= 0 || extensionDays > 365) {
      throw new Error("Extension days must be between 1 and 365")
    }

    // Get current contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status, due_date, extension_count")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      throw new Error("Contract not found")
    }

    // Only allow extension for ACTIVE, EXTENDED, or OVERDUE contracts
    const allowedStatuses = ["ACTIVE", "EXTENDED", "OVERDUE"]
    if (!allowedStatuses.includes(contract.status)) {
      throw new Error(
        `Cannot extend contract with status: ${contract.status}`
      )
    }

    const oldStatus = contract.status
    const currentDueDate = contract.due_date
      ? new Date(contract.due_date)
      : new Date()
    const newDueDate = new Date(currentDueDate)
    newDueDate.setDate(newDueDate.getDate() + extensionDays)

    // Update contract
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        due_date: newDueDate.toISOString().split("T")[0],
        status: "EXTENDED",
        extension_count: (contract.extension_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      throw new Error(`Failed to extend contract: ${updateError.message}`)
    }

    // Record status history
    await recordStatusHistory(
      contractId,
      oldStatus,
      "EXTENDED",
      staffId,
      `Gia hạn thêm ${extensionDays} ngày`
    )

    // Log activity
    await logActivity(
      staffId,
      contractId,
      "CONTRACT_EXTENDED",
      `Gia hạn ${extensionDays} ngày, ngày đáo hạn mới: ${newDueDate.toISOString().split("T")[0]}`
    )

    revalidatePath(`/contracts/${contractId}`)

    return { success: true, newDueDate: newDueDate.toISOString().split("T")[0] }
  } catch (error) {
    console.error("Error extending contract:", error)
    throw error
  }
}

/**
 * Redeem contract (customer pays full amount to get asset back)
 * Updates: status = 'REDEEMED', actual_end_date = now()
 * Logs: CONTRACT_REDEEMED activity and status history
 */
export async function redeemContract(
  contractId: string,
  paymentData: {
    amount: number
    paymentMethod: "CASH" | "BANK_TRANSFER" | "OTHER"
    notes?: string
  }
) {
  try {
    const staffId = await getCurrentStaffId()
    const supabase = await createClient()

    // Get current contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status, outstanding_balance, total_amount_paid, total_interest_paid")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      throw new Error("Contract not found")
    }

    // Only allow redeem for ACTIVE, EXTENDED, or OVERDUE contracts
    const allowedStatuses = ["ACTIVE", "EXTENDED", "OVERDUE"]
    if (!allowedStatuses.includes(contract.status)) {
      throw new Error(
        `Cannot redeem contract with status: ${contract.status}`
      )
    }

    const oldStatus = contract.status
    const today = new Date().toISOString().split("T")[0]

    // Start a transaction by using RPC or multiple operations
    // Update contract status
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "REDEEMED",
        actual_end_date: today,
        outstanding_balance: 0,
        total_amount_paid: (contract.total_amount_paid || 0) + paymentData.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      throw new Error(`Failed to redeem contract: ${updateError.message}`)
    }

    // Record payment
    const { error: paymentError } = await supabase
      .from("contract_payments")
      .insert({
        contract_id: contractId,
        payment_type: "FULL_REDEEM",
        payment_method: paymentData.paymentMethod,
        amount: paymentData.amount,
        interest_amount: 0,
        principal_amount: paymentData.amount,
        penalty_amount: 0,
        payment_date: today,
        received_by: staffId,
        notes: paymentData.notes || "Thanh toán chuộc tài sản",
      })

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`)
    }

    // Record status history
    await recordStatusHistory(
      contractId,
      oldStatus,
      "REDEEMED",
      staffId,
      "Khách hàng chuộc tài sản"
    )

    // Log activity
    await logActivity(
      staffId,
      contractId,
      "CONTRACT_REDEEMED",
      `Chuộc tài sản, số tiền: ${paymentData.amount.toLocaleString("vi-VN")} VND`
    )

    revalidatePath(`/contracts/${contractId}`)

    return { success: true }
  } catch (error) {
    console.error("Error redeeming contract:", error)
    throw error
  }
}

/**
 * Liquidate contract (asset is sold/liquidated)
 * Updates: status = 'LIQUIDATED', actual_end_date = now()
 * Logs: CONTRACT_LIQUIDATED activity and status history
 */
export async function liquidateContract(contractId: string, reason?: string) {
  try {
    const staffId = await getCurrentStaffId()
    const supabase = await createClient()

    // Get current contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      throw new Error("Contract not found")
    }

    // Only allow liquidation for ACTIVE, EXTENDED, or OVERDUE contracts
    const allowedStatuses = ["ACTIVE", "EXTENDED", "OVERDUE"]
    if (!allowedStatuses.includes(contract.status)) {
      throw new Error(
        `Cannot liquidate contract with status: ${contract.status}`
      )
    }

    const oldStatus = contract.status
    const today = new Date().toISOString().split("T")[0]

    // Update contract
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "LIQUIDATED",
        actual_end_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      throw new Error(`Failed to liquidate contract: ${updateError.message}`)
    }

    // Record status history
    await recordStatusHistory(
      contractId,
      oldStatus,
      "LIQUIDATED",
      staffId,
      reason || "Thanh lý tài sản"
    )

    // Log activity
    await logActivity(
      staffId,
      contractId,
      "CONTRACT_LIQUIDATED",
      reason || "Thanh lý tài sản"
    )

    revalidatePath(`/contracts/${contractId}`)

    return { success: true }
  } catch (error) {
    console.error("Error liquidating contract:", error)
    throw error
  }
}

/**
 * Cancel contract
 * Only allowed if status is 'DRAFT'
 * Updates: status = 'CANCELLED'
 * Logs: CONTRACT_CANCELLED activity
 */
export async function cancelContract(contractId: string, reason?: string) {
  try {
    const staffId = await getCurrentStaffId()
    const supabase = await createClient()

    // Get current contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      throw new Error("Contract not found")
    }

    // Only allow cancellation for DRAFT contracts
    if (contract.status !== "DRAFT") {
      throw new Error(
        `Cannot cancel contract with status: ${contract.status}. Only DRAFT contracts can be cancelled.`
      )
    }

    const oldStatus = contract.status

    // Update contract
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "CANCELLED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      throw new Error(`Failed to cancel contract: ${updateError.message}`)
    }

    // Record status history
    await recordStatusHistory(
      contractId,
      oldStatus,
      "CANCELLED",
      staffId,
      reason || "Hủy hợp đồng"
    )

    // Log activity
    await logActivity(
      staffId,
      contractId,
      "CONTRACT_CANCELLED",
      reason || "Hủy hợp đồng nháp"
    )

    revalidatePath(`/contracts/${contractId}`)

    return { success: true }
  } catch (error) {
    console.error("Error cancelling contract:", error)
    throw error
  }
}

/**
 * Activate a DRAFT contract
 * Updates: status = 'ACTIVE'
 * Logs: STATUS_CHANGED activity
 */
export async function activateContract(contractId: string) {
  try {
    const staffId = await getCurrentStaffId()
    const supabase = await createClient()

    // Get current contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("status")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      throw new Error("Contract not found")
    }

    // Only allow activation for DRAFT contracts
    if (contract.status !== "DRAFT") {
      throw new Error(
        `Cannot activate contract with status: ${contract.status}. Only DRAFT contracts can be activated.`
      )
    }

    const oldStatus = contract.status

    // Update contract
    const { error: updateError } = await supabase
      .from("contracts")
      .update({
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)

    if (updateError) {
      throw new Error(`Failed to activate contract: ${updateError.message}`)
    }

    // Record status history
    await recordStatusHistory(
      contractId,
      oldStatus,
      "ACTIVE",
      staffId,
      "Kích hoạt hợp đồng"
    )

    // Log activity
    await logActivity(staffId, contractId, "STATUS_CHANGED", "Kích hoạt hợp đồng từ nháp")

    revalidatePath(`/contracts/${contractId}`)

    return { success: true }
  } catch (error) {
    console.error("Error activating contract:", error)
    throw error
  }
}
