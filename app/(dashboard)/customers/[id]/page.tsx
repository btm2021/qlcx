import { createClient } from '@/lib/supabase/server'
import { Customer, Contract } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  CreditCard,
  FileText,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (customerError || !customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold">Không tìm thấy khách hàng</h1>
        <p className="text-muted-foreground mt-2">
          Khách hàng này không tồn tại hoặc đã bị xóa.
        </p>
        <Link href="/customers" className="mt-4">
          <Button>Quay lại danh sách</Button>
        </Link>
      </div>
    )
  }

  // Fetch customer's contracts
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      *,
      vehicle_categories:vehicle_category_id(code, name),
      contract_types:contract_type_id(code, name)
    `)
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  const typedCustomer = customer as Customer
  const typedContracts = contracts as (Contract & {
    vehicle_categories: { code: string; name: string }
    contract_types: { code: string; name: string }
  })[] || []

  const getIdCardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CMND: 'Chứng minh nhân dân',
      CCCD: 'Căn cước công dân',
      PASSPORT: 'Hộ chiếu',
      OTHER: 'Giấy tờ khác'
    }
    return labels[type] || type
  }

  const getGenderLabel = (gender?: string) => {
    const labels: Record<string, string> = {
      MALE: 'Nam',
      FEMALE: 'Nữ',
      OTHER: 'Khác'
    }
    return gender ? labels[gender] : '-'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      EXTENDED: 'bg-blue-100 text-blue-800',
      OVERDUE: 'bg-red-100 text-red-800',
      REDEEMED: 'bg-purple-100 text-purple-800',
      LIQUIDATING: 'bg-orange-100 text-orange-800',
      LIQUIDATED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    }
    const labels: Record<string, string> = {
      DRAFT: 'Nháp',
      ACTIVE: 'Đang hoạt động',
      EXTENDED: 'Đã gia hạn',
      OVERDUE: 'Quá hạn',
      REDEEMED: 'Đã chuộc',
      LIQUIDATING: 'Đang thanh lý',
      LIQUIDATED: 'Đã thanh lý',
      CANCELLED: 'Đã hủy'
    }
    return (
      <Badge className={styles[status] || ''} variant="secondary">
        {labels[status] || status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/customers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{typedCustomer.full_name}</h1>
            <p className="text-muted-foreground">
              Mã KH: {typedCustomer.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
        <Link href={`/customers/${id}/edit`}>
          <Button className="w-full sm:w-auto">
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Basic info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin liên hệ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-medium">{typedCustomer.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{typedCustomer.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{typedCustomer.address || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ID Card Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin giấy tờ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Loại giấy tờ</p>
                    <p className="font-medium">{getIdCardTypeLabel(typedCustomer.id_card_type)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số giấy tờ</p>
                    <p className="font-medium">{typedCustomer.id_card_number || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày cấp</p>
                    <p className="font-medium">
                      {typedCustomer.id_card_issued_date
                        ? new Date(typedCustomer.id_card_issued_date).toLocaleDateString('vi-VN')
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nơi cấp</p>
                    <p className="font-medium">{typedCustomer.id_card_issued_place || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ngày sinh</p>
                    <p className="font-medium">
                      {typedCustomer.date_of_birth
                        ? new Date(typedCustomer.date_of_birth).toLocaleDateString('vi-VN')
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Giới tính</p>
                    <p className="font-medium">{getGenderLabel(typedCustomer.gender)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contracts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hợp đồng</CardTitle>
            </CardHeader>
            <CardContent>
              {typedContracts.length > 0 ? (
                <div className="space-y-3">
                  {typedContracts.map((contract) => (
                    <Link
                      key={contract.id}
                      href={`/contracts/${contract.id}`}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contract.qr_code}</span>
                          {getStatusBadge(contract.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {contract.vehicle_categories?.name} • {contract.contract_types?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">
                            {contract.loan_amount?.toLocaleString('vi-VN')}đ
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(contract.contract_date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Chưa có hợp đồng nào
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Photos */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ảnh giấy tờ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ID Card Front */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Mặt trước</p>
                {typedCustomer.id_card_front_image ? (
                  <div className="relative aspect-[3/2] rounded-lg border overflow-hidden">
                    <Image
                      src={typedCustomer.id_card_front_image}
                      alt="Mặt trước CMND/CCCD"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/2] rounded-lg border border-dashed flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">Chưa có ảnh</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* ID Card Back */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Mặt sau</p>
                {typedCustomer.id_card_back_image ? (
                  <div className="relative aspect-[3/2] rounded-lg border overflow-hidden">
                    <Image
                      src={typedCustomer.id_card_back_image}
                      alt="Mặt sau CMND/CCCD"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/2] rounded-lg border border-dashed flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">Chưa có ảnh</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Portrait */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Ảnh chân dung</p>
                {typedCustomer.portrait_image ? (
                  <div className="relative aspect-square rounded-lg border overflow-hidden max-w-[200px] mx-auto">
                    <Image
                      src={typedCustomer.portrait_image}
                      alt="Ảnh chân dung"
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg border border-dashed flex items-center justify-center bg-muted max-w-[200px] mx-auto">
                    <p className="text-sm text-muted-foreground">Chưa có ảnh</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
