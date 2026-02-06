import { createClient } from '@/lib/supabase/server'
import { Customer } from '@/types'
import { CustomerCard } from '@/components/biz/customers/customer-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Users } from 'lucide-react'
import Link from 'next/link'

interface CustomersPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('customers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,id_card_number.ilike.%${q}%`)
  }

  const { data: customers, error } = await query

  if (error) {
    console.error('Error fetching customers:', error)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Khách hàng</h1>
          <p className="text-muted-foreground">
            Quản lý thông tin khách hàng cầm đồ
          </p>
        </div>
        <Link href="/customers/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách hàng
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Tìm theo tên, số điện thoại hoặc CMND/CCCD..."
            defaultValue={q}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          Tìm kiếm
        </Button>
      </form>

      {/* Results */}
      {customers && customers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer: Customer) => (
            <CustomerCard key={customer.id} customer={customer} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {q ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {q
              ? `Không tìm thấy khách hàng nào phù hợp với "${q}"`
              : 'Bắt đầu bằng cách thêm khách hàng mới vào hệ thống.'}
          </p>
          {!q && (
            <Link href="/customers/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Thêm khách hàng
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Results count */}
      {customers && customers.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Hiển thị {customers.length} khách hàng
        </p>
      )}
    </div>
  )
}
