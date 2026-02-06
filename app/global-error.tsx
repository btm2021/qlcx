'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

/**
 * Global Error Handler
 * Fallback UI when the entire application crashes
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical error
    console.error('Global Application Error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }, [error])

  return (
    <html lang="vi">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-lg w-full text-center space-y-8">
            {/* Critical Error Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>

            {/* Error Title */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground">
                Lỗi Hệ Thống
              </h1>
              <p className="text-lg text-muted-foreground">
                Ứng dụng gặp sự cố nghiêm trọng. Chúng tôi rất xin lỗi về sự bất tiện này.
              </p>
            </div>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-left bg-muted p-4 rounded-lg overflow-auto max-h-48">
                <p className="text-sm font-mono text-destructive">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Recovery Actions */}
            <div className="space-y-4">
              <Button
                onClick={reset}
                size="lg"
                className="gap-2"
              >
                <RefreshCcw className="w-5 h-5" />
                Khởi động lại ứng dụng
              </Button>

              <p className="text-sm text-muted-foreground">
                Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ bộ phận kỹ thuật:
                <br />
                <a
                  href="tel:+84123456789"
                  className="text-primary hover:underline"
                >
                  0123 456 789
                </a>
                {' | '}
                <a
                  href="mailto:support@camxe.vn"
                  className="text-primary hover:underline"
                >
                  support@camxe.vn
                </a>
              </p>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t">
              <p className="text-xs text-muted-foreground">
                Hệ thống Quản lý Cầm Đồ Xe
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
