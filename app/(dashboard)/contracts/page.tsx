import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ContractCard } from "@/components/biz/contracts/contract-card"
import { Plus, Search } from "lucide-react"
import { CONTRACT_STATUS, CONTRACT_STATUS_NAMES } from "@/lib/constants"
import type { ActiveContractView } from "@/types"

interface SearchParams {
  search?: string
  status?: string
}

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from("v_active_contracts").select("*")

  // Apply search filter
  if (params.search) {
    query = query.or(
      `qr_code.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_phone.ilike.%${params.search}%`
    )
  }

  // Apply status filter
  if (params.status && params.status !== "ALL") {
    query = query.eq("status", params.status)
  }

  const { data: contracts, error } = await query.order("due_date", {
    ascending: true,
  })

  if (error) {
    console.error("Error fetching contracts:", error)
  }

  const activeContracts = (contracts as ActiveContractView[]) || []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Danh sách hợp đồng</h1>
        <Link href="/contracts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo hợp đồng
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tìm kiếm & Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="search"
                placeholder="Tìm theo mã QR, tên khách hàng, SĐT..."
                defaultValue={params.search}
                className="pl-10"
              />
            </div>
            <Select name="status" defaultValue={params.status || "ALL"}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                {Object.entries(CONTRACT_STATUS).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {CONTRACT_STATUS_NAMES[key as keyof typeof CONTRACT_STATUS_NAMES]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              Lọc
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Contract Grid */}
      {activeContracts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeContracts.map((contract) => (
            <ContractCard key={contract.id} contract={contract} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {params.search || params.status
                ? "Không tìm thấy hợp đồng phù hợp"
                : "Chưa có hợp đồng nào. Tạo hợp đồng mới để bắt đầu."}
            </p>
            {!params.search && !params.status && (
              <Link href="/contracts/new" className="inline-block mt-4">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo hợp đồng
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
