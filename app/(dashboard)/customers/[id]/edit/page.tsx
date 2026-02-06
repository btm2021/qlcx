'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CustomerForm } from '@/components/biz/customers/customer-form'
import { updateCustomer } from '../../actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Customer } from '@/types'
import type { CustomerFormData } from '@/components/biz/customers/customer-form'

interface EditCustomerPageProps {
  params: Promise<{ id: string }>
}

export default function EditCustomerPage({ params }: EditCustomerPageProps) {
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string>('')

  useEffect(() => {
    async function loadParams() {
      const { id } = await params
      setCustomerId(id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!customerId) return

    async function fetchCustomer() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (error) {
        setError('Không thể tải thông tin khách hàng')
        console.error(error)
      } else {
        setCustomer(data as Customer)
      }
      setIsFetching(false)
    }

    fetchCustomer()
  }, [customerId])

  async function handleSubmit(data: CustomerFormData) {
    if (!customerId) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await updateCustomer(customerId, data)

      if (result.success) {
        router.push(`/customers/${customerId}`)
        router.refresh()
      } else {
        setError(result.error || 'Có lỗi xảy ra khi cập nhật khách hàng')
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi cập nhật khách hàng')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/customers/${customerId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-4">
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
          <div className="h-12 animate-pulse rounded bg-muted" />
        </div>
      </div>
    )
  }

  if (!customer && !isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold">Không tìm thấy khách hàng</h1>
        <Link href="/customers" className="mt-4">
          <Button>Quay lại danh sách</Button>
        </Link>
      </div>
    )
  }

  const initialData: Partial<CustomerFormData> = customer ? {
    full_name: customer.full_name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    id_card_type: customer.id_card_type,
    id_card_number: customer.id_card_number,
    id_card_issued_date: customer.id_card_issued_date,
    id_card_issued_place: customer.id_card_issued_place,
    date_of_birth: customer.date_of_birth,
    gender: customer.gender,
    id_card_front_image: customer.id_card_front_image,
    id_card_back_image: customer.id_card_back_image,
    portrait_image: customer.portrait_image,
    notes: customer.notes,
  } : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/customers/${customerId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chỉnh sửa khách hàng</h1>
          <p className="text-muted-foreground">
            Cập nhật thông tin khách hàng
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Form */}
      <CustomerForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}
