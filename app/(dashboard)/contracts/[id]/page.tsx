import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import {
  ArrowLeft,
  User,
  Car,
  Calendar,
  Banknote,
  Package,
  History,
  Camera,
  CheckCircle,
  Clock,
  Search,
  MapPin,
} from "lucide-react"
import {
  CONTRACT_STATUS_NAMES,
  CONTRACT_TYPE_NAMES,
  VEHICLE_CATEGORY_NAMES,
  PAYMENT_TYPE_NAMES,
} from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ContractActions } from "@/components/biz/contracts/contract-actions"
import type { Contract, Customer, Vehicle, ContractStatusHistory, ContractPayment, InspectionLog } from "@/types"

interface ContractDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch contract with related data
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`
      *,
      customer:customers(*),
      vehicle:vehicles(*),
      vehicle_category:vehicle_categories(*),
      contract_type:contract_types(*),
      creator:staff!contracts_created_by_fkey(full_name),
      receiver:staff!contracts_received_by_fkey(full_name)
    `)
    .eq("id", id)
    .single()

  if (contractError || !contract) {
    notFound()
  }

  // Fetch status history
  const { data: statusHistory } = await supabase
    .from("contract_status_history")
    .select(`
      *,
      changed_by_staff:staff(full_name)
    `)
    .eq("contract_id", id)
    .order("changed_at", { ascending: false })

  // Fetch contract images
  const { data: images } = await supabase
    .from("contract_images")
    .select("*")
    .eq("contract_id", id)
    .order("uploaded_at", { ascending: false })

  // Fetch inspection logs
  const { data: inspections } = await supabase
    .from("inspection_logs")
    .select(`
      *,
      staff:staff(full_name)
    `)
    .eq("contract_id", id)
    .order("inspected_at", { ascending: false })

  // Fetch payments
  const { data: payments } = await supabase
    .from("contract_payments")
    .select(`
      *,
      received_by_staff:staff(full_name)
    `)
    .eq("contract_id", id)
    .order("payment_date", { ascending: false })

  // Fetch activity logs
  const { data: activityLogs } = await supabase
    .from("activity_logs")
    .select(`
      *,
      staff:staff(full_name)
    `)
    .eq("contract_id", id)
    .order("log_timestamp", { ascending: false })
    .limit(20)

  const typedContract = contract as Contract & {
    customer: Customer
    vehicle: Vehicle | null
    vehicle_category: { code: string; name: string }
    contract_type: { code: string; name: string }
    creator: { full_name: string }
    receiver?: { full_name: string }
  }

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-500",
    ACTIVE: "bg-green-500",
    EXTENDED: "bg-blue-500",
    OVERDUE: "bg-red-500",
    REDEEMED: "bg-purple-500",
    LIQUIDATING: "bg-orange-500",
    LIQUIDATED: "bg-slate-500",
    CANCELLED: "bg-gray-400",
  }

  const isActive = ["ACTIVE", "EXTENDED", "OVERDUE"].includes(typedContract.status)
  const isDraft = typedContract.status === "DRAFT"
  const isClosed = ["REDEEMED", "LIQUIDATED", "CANCELLED"].includes(typedContract.status)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/contracts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{typedContract.qr_code}</h1>
            <Badge
              variant="secondary"
              className={cn(
                "text-white",
                statusColors[typedContract.status] || "bg-gray-500"
              )}
            >
              {CONTRACT_STATUS_NAMES[typedContract.status as keyof typeof CONTRACT_STATUS_NAMES]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Tạo bởi {typedContract.creator?.full_name} ·{" "}
            {format(new Date(typedContract.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {(isActive || isDraft) && (
        <ContractActions contract={typedContract} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mã QR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <QRCodeSVG
                  value={typedContract.qr_code}
                  size={128}
                  level="M"
                  className="rounded-lg"
                />
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-2xl font-mono font-bold">{typedContract.qr_code}</p>
                  <p className="text-muted-foreground">
                    {VEHICLE_CATEGORY_NAMES[typedContract.vehicle_category.code as keyof typeof VEHICLE_CATEGORY_NAMES]} ·{" "}
                    {CONTRACT_TYPE_NAMES[typedContract.contract_type.code as keyof typeof CONTRACT_TYPE_NAMES]}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Thông tin khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Họ tên</p>
                  <p className="font-medium">{typedContract.customer.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{typedContract.customer.phone || "Chưa có"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CMND/CCCD</p>
                  <p className="font-medium">{typedContract.customer.id_card_number || "Chưa có"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Địa chỉ</p>
                  <p className="font-medium">{typedContract.customer.address || "Chưa có"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="w-4 h-4" />
                Thông tin xe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {typedContract.vehicle ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Loại xe</p>
                    <p className="font-medium">{typedContract.vehicle_category.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Biển số</p>
                    <p className="font-medium">{typedContract.vehicle.license_plate || "Chưa có"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hãng/Model</p>
                    <p className="font-medium">
                      {typedContract.vehicle.brand || "Chưa có"}
                      {typedContract.vehicle.model && ` ${typedContract.vehicle.model}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Màu sắc</p>
                    <p className="font-medium">{typedContract.vehicle.color || "Chưa có"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số máy</p>
                    <p className="font-medium">{typedContract.vehicle.engine_number || "Chưa có"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số khung</p>
                    <p className="font-medium">{typedContract.vehicle.chassis_number || "Chưa có"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vị trí lưu kho</p>
                    <p className="font-medium">{typedContract.vehicle.storage_location || "Chưa có"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Số chìa khóa</p>
                    <p className="font-medium">{typedContract.vehicle.key_count}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Chưa có thông tin xe</p>
              )}
            </CardContent>
          </Card>

          {/* Photo Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Hình ảnh tài sản
              </CardTitle>
            </CardHeader>
            <CardContent>
              {images && images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div
                      key={image.id}
                      className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden"
                    >
                      <img
                        src={image.file_path}
                        alt={image.caption || "Contract image"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed rounded-lg">
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Chưa có hình ảnh</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Camera className="w-4 h-4 mr-2" />
                    Thêm ảnh
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inspection History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="w-4 h-4" />
                Lịch sử kiểm tra
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inspections && inspections.length > 0 ? (
                <div className="space-y-4">
                  {inspections.map((inspection: InspectionLog & { staff: { full_name: string } }) => (
                    <div key={inspection.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                      <div className="flex-shrink-0">
                        {inspection.result === "PRESENT" ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-red-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {inspection.result === "PRESENT" ? "Có mặt trong kho" : "Không có mặt"}
                          </span>
                          <Badge variant={inspection.result === "PRESENT" ? "default" : "destructive"}>
                            {inspection.result === "PRESENT" ? "OK" : "BÁO ĐỘNG"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {inspection.staff?.full_name} ·{" "}
                          {format(new Date(inspection.inspected_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                        {inspection.gps_latitude && inspection.gps_longitude && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {inspection.gps_latitude.toFixed(6)}, {inspection.gps_longitude.toFixed(6)}
                            {inspection.gps_accuracy && ` (±${inspection.gps_accuracy}m)`}
                          </p>
                        )}
                        {inspection.missing_note && (
                          <p className="text-sm text-red-600 mt-1">
                            Ghi chú: {inspection.missing_note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có lịch sử kiểm tra</p>
              )}
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Lịch sử thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment: ContractPayment & { received_by_staff: { full_name: string } }) => (
                    <div key={payment.id} className="flex justify-between items-start pb-4 border-b last:border-0 last:pb-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {PAYMENT_TYPE_NAMES[payment.payment_type as keyof typeof PAYMENT_TYPE_NAMES] || payment.payment_type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {payment.payment_method === "CASH" ? "Tiền mặt" :
                             payment.payment_method === "BANK_TRANSFER" ? "Chuyển khoản" : "Khác"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {payment.received_by_staff?.full_name} ·{" "}
                          {format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: vi })}
                        </p>
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{payment.notes}</p>
                        )}
                        {payment.receipt_number && (
                          <p className="text-xs text-muted-foreground">Số phiếu: {payment.receipt_number}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {payment.amount.toLocaleString("vi-VN")} VND
                        </p>
                        {(payment.interest_amount > 0 || payment.principal_amount > 0) && (
                          <p className="text-xs text-muted-foreground">
                            {payment.principal_amount > 0 && `Gốc: ${payment.principal_amount.toLocaleString("vi-VN")}`}
                            {payment.interest_amount > 0 && ` · Lãi: ${payment.interest_amount.toLocaleString("vi-VN")}`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có lịch sử thanh toán</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financial & History */}
        <div className="space-y-4">
          {/* Financial Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                Thông tin tài chính
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Giá trị thẩm định</p>
                <p className="text-xl font-bold">
                  {typedContract.appraised_value?.toLocaleString("vi-VN") || "0"} VND
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số tiền cho vay</p>
                <p className="text-xl font-bold text-primary">
                  {typedContract.loan_amount?.toLocaleString("vi-VN") || "0"} VND
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Lãi suất</p>
                  <p className="font-medium">{typedContract.interest_rate}%/tháng</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số lần gia hạn</p>
                  <p className="font-medium">{typedContract.extension_count}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Dư nợ còn lại</p>
                <p className="text-lg font-bold">
                  {typedContract.outstanding_balance?.toLocaleString("vi-VN") || "0"} VND
                </p>
              </div>
              {typedContract.total_amount_paid > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Tổng đã thanh toán</p>
                  <p className="font-medium text-green-600">
                    {typedContract.total_amount_paid.toLocaleString("vi-VN")} VND
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Thời gian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Ngày hợp đồng</p>
                <p className="font-medium">
                  {typedContract.contract_date
                    ? format(new Date(typedContract.contract_date), "dd/MM/yyyy", { locale: vi })
                    : "Chưa có"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày bắt đầu</p>
                <p className="font-medium">
                  {typedContract.start_date
                    ? format(new Date(typedContract.start_date), "dd/MM/yyyy", { locale: vi })
                    : "Chưa có"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ngày đáo hạn</p>
                <p
                  className={cn(
                    "font-medium",
                    typedContract.status === "OVERDUE" && "text-red-600"
                  )}
                >
                  {typedContract.due_date
                    ? format(new Date(typedContract.due_date), "dd/MM/yyyy", { locale: vi })
                    : "Chưa có"}
                </p>
              </div>
              {typedContract.actual_end_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Ngày kết thúc thực tế</p>
                  <p className="font-medium">
                    {format(new Date(typedContract.actual_end_date), "dd/MM/yyyy", { locale: vi })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Reception Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4" />
                Trạng thái tiếp nhận
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {typedContract.is_asset_received ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Đã tiếp nhận tài sản</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span>Chưa tiếp nhận tài sản</span>
                  </>
                )}
              </div>
              {typedContract.received_at && (
                <p className="text-sm text-muted-foreground mt-2">
                  {format(new Date(typedContract.received_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                  {typedContract.receiver && ` · ${typedContract.receiver.full_name}`}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                Lịch sử trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory && statusHistory.length > 0 ? (
                <div className="space-y-3">
                  {(statusHistory as (ContractStatusHistory & { changed_by_staff: { full_name: string } })[]).map((history, index: number) => (
                    <div key={history.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            index === 0 ? "bg-primary" : "bg-muted-foreground"
                          )}
                        />
                        {index < statusHistory.length - 1 && (
                          <div className="w-px h-full bg-border mt-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm">
                          <Badge variant="outline" className="text-xs">
                            {CONTRACT_STATUS_NAMES[history.new_status as keyof typeof CONTRACT_STATUS_NAMES]}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {history.changed_by_staff?.full_name} ·{" "}
                          {format(new Date(history.changed_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                        {history.reason && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Lý do: {history.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có lịch sử thay đổi</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs && activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {activityLogs.map((log: { id: string; action: string; note?: string; log_timestamp: string; staff?: { full_name: string } }) => (
                    <div key={log.id} className="text-sm">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.staff?.full_name} ·{" "}
                        {format(new Date(log.log_timestamp), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </p>
                      {log.note && (
                        <p className="text-xs text-muted-foreground mt-1">{log.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Chưa có hoạt động</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
