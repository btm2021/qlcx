'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerForm } from '@/components/biz/customers/customer-form'
import { createCustomer } from '../actions'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { CustomerFormData } from '@/components/biz/customers/customer-form'

export default function NewCustomerPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(data: CustomerFormData) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createCustomer(data)

      if (result.success) {
        router.push(`/customers/${result.customerId}`)
        router.refresh()
      } else {
        setError(result.error || 'Có lỗi xảy ra khi tạo khách hàng')
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tạo khách hàng')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Thêm khách hàng mới</h1>
          <p className="text-muted-foreground">
            Nhập thông tin khách hàng và giấy tờ tùy thân
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
      <CustomerForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  )
}
