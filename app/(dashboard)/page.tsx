'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText,
  ScanLine,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import { ActiveContractView } from '@/types'
import { format, startOfDay, endOfDay } from 'date-fns'
import { vi } from 'date-fns/locale'

interface DashboardStats {
  activeContracts: number
  overdueContracts: number
  needInspection: number
  todayNewContracts: number
}

interface RecentContract {
  id: string
  qr_code: string
  customer_name: string
  contract_date: string
  status: string
  vehicle_category_code: string
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
      </CardContent>
    </Card>
  )
}

function RecentContractsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentContracts, setRecentContracts] = useState<RecentContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const supabase = createClient()

        // Fetch active contracts count
        const { count: activeCount, error: activeError } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .in('status', ['ACTIVE', 'EXTENDED'])

        if (activeError) throw activeError

        // Fetch overdue contracts count
        const { count: overdueCount, error: overdueError } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'OVERDUE')

        if (overdueError) throw overdueError

        // Fetch contracts needing inspection from view
        const { data: inspectionData, error: inspectionError } = await supabase
          .from('v_contracts_need_inspection')
          .select('id')

        if (inspectionError) throw inspectionError

        // Fetch today's new contracts
        const today = new Date()
        const { count: todayCount, error: todayError } = await supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfDay(today).toISOString())
          .lte('created_at', endOfDay(today).toISOString())

        if (todayError) throw todayError

        // Fetch recent contracts
        const { data: recentData, error: recentError } = await supabase
          .from('v_active_contracts')
          .select('id, qr_code, customer_name, contract_date, status, vehicle_category_code')
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentError) throw recentError

        setStats({
          activeContracts: activeCount || 0,
          overdueContracts: overdueCount || 0,
          needInspection: inspectionData?.length || 0,
          todayNewContracts: todayCount || 0,
        })

        setRecentContracts(recentData || [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-50'
      case 'EXTENDED':
        return 'text-blue-600 bg-blue-50'
      case 'OVERDUE':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hoạt động'
      case 'EXTENDED':
        return 'Đã gia hạn'
      case 'OVERDUE':
        return 'Quá hạn'
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="gap-2">
            <Link href="/contracts/new">
              <Plus className="h-4 w-4" />
              Tạo hợp đồng mới
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/scan">
              <QrCode className="h-4 w-4" />
              Quét QR kiểm tra
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hợp đồng đang hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-2xl font-bold">{stats?.activeContracts || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hợp đồng quá hạn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">
                    {stats?.overdueContracts || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Cần kiểm tra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ScanLine className="h-5 w-5 text-amber-600" />
                  <span className="text-2xl font-bold text-amber-600">
                    {stats?.needInspection || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hợp đồng hôm nay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">{stats?.todayNewContracts || 0}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Contracts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Hợp đồng gần đây</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contracts">Xem tất cả</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <RecentContractsSkeleton />
          ) : recentContracts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có hợp đồng nào</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href="/contracts/new">Tạo hợp đồng mới</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentContracts.map((contract) => (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <QrCode className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{contract.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contract.qr_code} ·{' '}
                      {format(new Date(contract.contract_date), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      contract.status
                    )}`}
                  >
                    {getStatusLabel(contract.status)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions for Mobile */}
      <div className="grid grid-cols-2 gap-4 md:hidden">
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link href="/contracts/new">
            <Plus className="h-6 w-6" />
            <span>Tạo hợp đồng</span>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
          <Link href="/scan">
            <ScanLine className="h-6 w-6" />
            <span>Quét QR</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
