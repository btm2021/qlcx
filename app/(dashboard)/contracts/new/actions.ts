"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import type { ContractFormData } from "@/components/biz/contracts/contract-form"

export async function createContract(formData: ContractFormData) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Get staff ID from auth user
  const { data: staff } = await supabase
    .from("staff")
    .select("id")
    .eq("auth_user_id", user.id)
    .single()

  if (!staff) {
    throw new Error("Staff not found")
  }

  // Call the RPC function to create contract
  const { data, error } = await supabase.rpc("fn_create_contract", {
    p_customer_id: formData.customer_id,
    p_vehicle_category_code: formData.vehicle_category_code,
    p_contract_type_code: formData.contract_type_code,
    p_created_by: staff.id,
    p_appraised_value: formData.appraised_value,
    p_loan_amount: formData.loan_amount,
    p_interest_rate: formData.interest_rate,
    p_duration_days: formData.duration_days,
    p_notes: formData.notes,
  })

  if (error) {
    console.error("Error creating contract:", error)
    throw new Error(error.message)
  }

  // Redirect to contract detail page
  if (data && data.length > 0) {
    redirect(`/contracts/${data[0].contract_id}`)
  }
}
