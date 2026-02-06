import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { QRCodeSVG } from 'qrcode.react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { parseQRCode, getCategoryLabel, getTypeLabel } from '@/lib/utils/qrcode'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface PrintContractPageProps {
  params: Promise<{
    id: string
  }>
}

/**
 * Generate metadata for print page
 */
export async function generateMetadata({ params }: PrintContractPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('contracts')
    .select('qr_code')
    .eq('id', id)
    .single()

  return {
    title: contract ? `In hợp đồng ${contract.qr_code}` : 'In hợp đồng',
  }
}

/**
 * Printable Contract View
 * Clean layout optimized for printing with QR code
 */
export default async function PrintContractPage({ params }: PrintContractPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch contract with all related data
  const { data: contract } = await supabase
    .from('contracts')
    .select(`
      *,
      customer:customers(*),
      vehicle_category:vehicle_categories(*),
      contract_type:contract_types(*),
      created_by_staff:staff(full_name, staff_code),
      vehicle:vehicles(*)
    `)
    .eq('id', id)
    .single()

  if (!contract) {
    notFound()
  }

  const parsedQR = parseQRCode(contract.qr_code)
  const categoryLabel = getCategoryLabel(parsedQR?.category || '')
  const typeLabel = getTypeLabel(parsedQR?.type || '')

  return (
    <div className="min-h-screen bg-white">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <Button
          onClick={() => window.print()}
          className="gap-2"
        >
          <Printer className="w-4 h-4" />
          In hợp đồng
        </Button>
      </div>

      {/* Print Container */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold uppercase">
                Cửa Hàng Cầm Đồ Xe
              </h1>
              <p className="text-sm text-gray-600">
                Địa chỉ: _______________________________
              </p>
              <p className="text-sm text-gray-600">
                Điện thoại: _____________________________
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                Mã hợp đồng:
              </p>
              <p className="text-lg font-bold font-mono">
                {contract.qr_code}
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold uppercase">
            Hợp Đồng {typeLabel}
          </h2>
          <p className="text-sm text-gray-600">
            Loại tài sản: {categoryLabel}
          </p>
        </div>

        {/* Contract Info Grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-1">Thông tin khách hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Họ tên:</span>
                <span className="font-medium">{contract.customer?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số điện thoại:</span>
                <span>{contract.customer?.phone || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CMND/CCCD:</span>
                <span>{contract.customer?.id_card_number || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Địa chỉ:</span>
                <span>{contract.customer?.address || '_________________'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold border-b pb-1">Thông tin hợp đồng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày ký:</span>
                <span>{formatDate(contract.contract_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ngày đáo hạn:</span>
                <span className="font-medium">{formatDate(contract.due_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lãi suất:</span>
                <span>{contract.interest_rate}%/tháng</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nhân viên:</span>
                <span>{contract.created_by_staff?.full_name || '_________________'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle Info */}
        {contract.vehicle && (
          <div className="mb-6">
            <h3 className="font-semibold border-b pb-1 mb-3">Thông tin tài sản</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Biển số xe:</span>
                <span className="font-medium">{contract.vehicle.license_plate || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hãng xe:</span>
                <span>{contract.vehicle.brand || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dòng xe:</span>
                <span>{contract.vehicle.model || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Năm sản xuất:</span>
                <span>{contract.vehicle.year_of_manufacture || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Màu sắc:</span>
                <span>{contract.vehicle.color || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số máy:</span>
                <span>{contract.vehicle.engine_number || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số khung:</span>
                <span>{contract.vehicle.chassis_number || '_________________'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Vị trí kho:</span>
                <span>{contract.vehicle.storage_location || '_________________'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Financial Info */}
        <div className="mb-6">
          <h3 className="font-semibold border-b pb-1 mb-3">Thông tin tài chính</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded">
              <p className="text-sm text-gray-600 mb-1">Giá trị thẩm định</p>
              <p className="text-lg font-bold">
                {formatCurrency(contract.appraised_value)}
              </p>
            </div>
            <div className="text-center p-4 border rounded bg-gray-50">
              <p className="text-sm text-gray-600 mb-1">Số tiền cho vay</p>
              <p className="text-xl font-bold text-primary">
                {formatCurrency(contract.loan_amount)}
              </p>
            </div>
            <div className="text-center p-4 border rounded">
              <p className="text-sm text-gray-600 mb-1">Dư nợ hiện tại</p>
              <p className="text-lg font-bold">
                {formatCurrency(contract.outstanding_balance)}
              </p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg inline-block">
              <QRCodeSVG
                value={contract.qr_code}
                size={150}
                level="M"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Quét mã QR để kiểm tra hợp đồng
            </p>
            <p className="text-xs font-mono text-gray-500">
              {contract.qr_code}
            </p>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="mb-8 text-sm">
          <h3 className="font-semibold border-b pb-1 mb-3">Điều khoản hợp đồng</h3>
          <ol className="list-decimal list-inside space-y-1 text-gray-700">
            <li>Bên A (khách hàng) đồng ý cầm cố tài sản theo giá trị thỏa thuận.</li>
            <li>Bên B (cửa hàng) đồng ý cho vay số tiền theo giá trị thẩm định.</li>
            <li>Lãi suất được tính theo tháng, thanh toán định kỳ hoặc một lần khi đáo hạn.</li>
            <li>Sau thời hạn hợp đồng, nếu không thanh toán, tài sản sẽ được xử lý theo quy định.</li>
            <li>Mọi tranh chấp sẽ được giải quyết theo pháp luật Việt Nam.</li>
          </ol>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
            <p className="font-semibold mb-8">BÊN A (Khách hàng)</p>
            <p className="text-sm text-gray-600">Ký tên</p>
            <div className="h-20"></div>
            <p className="font-medium">{contract.customer?.full_name}</p>
          </div>
          <div className="text-center">
            <p className="font-semibold mb-8">BÊN B (Cửa hàng)</p>
            <p className="text-sm text-gray-600">Ký tên</p>
            <div className="h-20"></div>
            <p className="font-medium">{contract.created_by_staff?.full_name || '_________________'}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t text-center text-xs text-gray-500">
          <p>Hợp đồng được tạo tự động từ hệ thống quản lý cầm đồ</p>
          <p>Ngày in: {formatDate(new Date())}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .print\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
