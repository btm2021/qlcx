'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/biz/auth/login-form'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message === 'Invalid login credentials'
          ? 'Email hoặc mật khẩu không đúng'
          : signInError.message
        )
        return
      }

      // Update last_login_at in staff table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('staff')
          .update({ last_login_at: new Date().toISOString() })
          .eq('auth_user_id', user.id)
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>
          Hệ thống Quản lý Cầm Đồ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          onSubmit={handleLogin}
          isLoading={isLoading}
          error={error}
        />
      </CardContent>
    </Card>
  )
}
