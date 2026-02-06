import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'

/**
 * Global 404 Not Found Page
 * Displayed when a route is not found
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* 404 Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <FileQuestion className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-foreground">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-foreground">
            Không tìm thấy trang
          </h2>
          <p className="text-muted-foreground">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            variant="default"
            className="gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Về trang chủ
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ{' '}
            <Link
              href="mailto:support@camxe.vn"
              className="text-primary hover:underline"
            >
              bộ phận hỗ trợ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
