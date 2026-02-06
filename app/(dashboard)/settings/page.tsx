'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Lock,
  Moon,
  Bell,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  full_name: string
  email?: string
  phone?: string
  role: string
  staff_code: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Preferences state
  const [preferences, setPreferences] = useState({
    darkMode: false,
    notifications: true,
  })

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient()

        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/login')
          return
        }

        const { data: staffData, error } = await supabase
          .from('staff')
          .select('id, full_name, email, phone, role, staff_code')
          .eq('auth_user_id', authUser.id)
          .single()

        if (error) {
          console.error('Error fetching staff:', error)
          return
        }

        setUser(staffData)
        setProfileForm({
          full_name: staffData.full_name || '',
          phone: staffData.phone || '',
        })
      } catch (err) {
        console.error('Error fetching user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('staff')
        .update({
          full_name: profileForm.full_name,
          phone: profileForm.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' })
    } catch (err) {
      console.error('Error updating profile:', err)
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi cập nhật thông tin.' })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp.' })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' })
      return
    }

    setSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' })
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err: any) {
      console.error('Error changing password:', err)
      setMessage({ type: 'error', text: err.message || 'Có lỗi xảy ra khi đổi mật khẩu.' })
    } finally {
      setSaving(false)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'Quản trị viên cấp cao'
      case 'ADMIN':
        return 'Quản trị viên'
      case 'MANAGER':
        return 'Quản lý'
      case 'STAFF':
        return 'Nhân viên'
      default:
        return role
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Cài đặt</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin tài khoản và tùy chọn ứng dụng
        </p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Thông tin</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Mật khẩu</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Moon className="h-4 w-4" />
            <span className="hidden sm:inline">Tùy chọn</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription>
                Xem và cập nhật thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Read-only info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-muted-foreground">Mã nhân viên</Label>
                  <p className="font-medium">{user?.staff_code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vai trò</Label>
                  <p className="font-medium">{getRoleLabel(user?.role || '')}</p>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{user?.email || 'Chưa cập nhật'}</p>
                </div>
              </div>

              <Separator />

              {/* Editable form */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Họ và tên</Label>
                    <Input
                      id="full_name"
                      value={profileForm.full_name}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))
                      }
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Cập nhật mật khẩu để bảo vệ tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                    placeholder="Nhập mật khẩu mới"
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    placeholder="Nhập lại mật khẩu mới"
                    minLength={6}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      'Đổi mật khẩu'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Tùy chọn ứng dụng
              </CardTitle>
              <CardDescription>
                Tùy chỉnh trải nghiệm sử dụng ứng dụng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Chế độ tối</Label>
                  <p className="text-sm text-muted-foreground">
                    Bật giao diện tối cho ứng dụng (sắp ra mắt)
                  </p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, darkMode: checked }))
                  }
                  disabled
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Thông báo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Nhận thông báo về hợp đồng sắp đến hạn
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({ ...prev, notifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Các tùy chọn nâng cao khác sẽ được cập nhật trong phiên bản tới.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
