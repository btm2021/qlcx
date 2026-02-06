import { createClient } from "@/lib/supabase/server"
import { ContractForm } from "@/components/biz/contracts/contract-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createContract } from "./actions"
import type { Customer } from "@/types"

export default async function NewContractPage() {
  const supabase = await createClient()

  // Fetch customers for selection
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .eq("is_active", true)
    .order("full_name", { ascending: true })

  if (error) {
    console.error("Error fetching customers:", error)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tạo hợp đồng mới</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin hợp đồng</CardTitle>
        </CardHeader>
        <CardContent>
          <ContractForm
            customers={(customers as Customer[]) || []}
            onSubmit={createContract}
          />
        </CardContent>
      </Card>
    </div>
  )
}
