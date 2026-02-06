'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'
import Link from 'next/link'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Dashboard Error Boundary
 * Handles errors within the dashboard routes
 */
export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    // Log error details for monitoring
    console.error('Dashboard Error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })

    // In production, you might send this to an error tracking service
    // like Sentry, LogRocket, etc.
  }, [error])

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Đã xảy ra lỗi
          </h2>
          <p className="text-muted-foreground text-sm">
            {error.message || 'Không thể tải nội dung. Vui lòng thử lại.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">
              Mã lỗi: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Thử lại
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-2"
          >
            <Link href="/">
              <Home className="w-4 h-4" />
              Về trang chủ
            </Link>
          </Button>
        </div>

        {/* Support Info */}
        <p className="text-xs text-muted-foreground">
          Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ quản trị viên.
        </p>
      </div>
    </div>
  )
}
