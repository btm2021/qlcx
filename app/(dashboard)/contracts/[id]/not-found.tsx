import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileX, Search, Plus } from 'lucide-react'

/**
 * Contract-specific 404 Not Found Page
 * Displayed when a contract is not found
 */
export default function ContractNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <FileX className="w-10 h-10 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Không tìm thấy hợp đồng
          </h2>
          <p className="text-muted-foreground">
            Hợp đồng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-muted rounded-lg p-4 text-left">
          <p className="text-sm font-medium mb-2">Gợi ý:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Kiểm tra lại mã QR hoặc ID hợp đồng</li>
            <li>Đảm bảo hợp đồng chưa bị xóa khỏi hệ thống</li>
            <li>Liên hệ quản trị viên nếu bạn cần trợ giúp</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            variant="default"
            className="gap-2"
          >
            <Link href="/contracts">
              <Search className="w-4 h-4" />
              Tìm hợp đồng
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link href="/contracts/new">
              <Plus className="w-4 h-4" />
              Tạo hợp đồng mới
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
