import Link from 'next/link'
import { QrCode, ChevronRight, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface RecentContract {
  id: string
  qr_code: string
  customer_name: string
  contract_date: string
  status: 'ACTIVE' | 'EXTENDED' | 'OVERDUE' | 'DRAFT' | string
  vehicle_category_code?: string
  license_plate?: string
}

interface RecentContractsProps {
  contracts: RecentContract[]
  loading?: boolean
  maxItems?: number
  showViewAll?: boolean
  viewAllHref?: string
  className?: string
}

const statusConfig = {
  ACTIVE: {
    label: 'Đang hoạt động',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  EXTENDED: {
    label: 'Đã gia hạn',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  OVERDUE: {
    label: 'Quá hạn',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
  DRAFT: {
    label: 'Nháp',
    className: 'bg-gray-50 text-gray-700 border-gray-200',
  },
  REDEEMED: {
    label: 'Đã chuộc',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  LIQUIDATED: {
    label: 'Đã thanh lý',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
}

function getStatusStyle(status: string) {
  return (
    statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-50 text-gray-700 border-gray-200',
    }
  )
}

function ContractItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg">
      <Skeleton className="h-10 w-10 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
  )
}

export function RecentContracts({
  contracts,
  loading = false,
  maxItems = 5,
  showViewAll = true,
  viewAllHref = '/contracts',
  className,
}: RecentContractsProps) {
  const displayContracts = contracts.slice(0, maxItems)

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Hợp đồng gần đây</CardTitle>
        {showViewAll && (
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href={viewAllHref}>
              Xem tất cả
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: maxItems }).map((_, i) => (
              <ContractItemSkeleton key={i} />
            ))}
          </div>
        ) : displayContracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Chưa có hợp đồng nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              Hợp đồng mới sẽ xuất hiện ở đây
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/contracts/new">Tạo hợp đồng mới</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {displayContracts.map((contract) => {
              const status = getStatusStyle(contract.status)
              return (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className={cn(
                    'group flex items-center gap-4 p-3 rounded-lg border',
                    'transition-colors hover:bg-accent hover:border-accent',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                >
                  {/* QR Icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <QrCode className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Contract Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">
                      {contract.customer_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <span className="font-mono">{contract.qr_code}</span>
                      <span>·</span>
                      <time dateTime={contract.contract_date}>
                        {format(new Date(contract.contract_date), 'dd/MM/yyyy', {
                          locale: vi,
                        })}
                      </time>
                    </div>
                    {contract.license_plate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        BS: {contract.license_plate}
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span
                    className={cn(
                      'shrink-0 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                      status.className
                    )}
                  >
                    {status.label}
                  </span>

                  {/* Arrow (visible on hover) */}
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground shrink-0',
                      'opacity-0 -translate-x-2 transition-all',
                      'group-hover:opacity-100 group-hover:translate-x-0'
                    )}
                  />
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for smaller spaces
interface CompactRecentContractsProps {
  contracts: RecentContract[]
  loading?: boolean
  maxItems?: number
  className?: string
}

export function CompactRecentContracts({
  contracts,
  loading = false,
  maxItems = 3,
  className,
}: CompactRecentContractsProps) {
  const displayContracts = contracts.slice(0, maxItems)

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: maxItems }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (displayContracts.length === 0) {
    return (
      <div className={cn('text-center py-4 text-sm text-muted-foreground', className)}>
        Chưa có hợp đồng
      </div>
    )
  }

  return (
    <div className={cn('space-y-1', className)}>
      {displayContracts.map((contract) => {
        const status = getStatusStyle(contract.status)
        return (
          <Link
            key={contract.id}
            href={`/contracts/${contract.id}`}
            className={cn(
              'flex items-center gap-3 p-2 rounded-md',
              'hover:bg-accent transition-colors'
            )}
          >
            <div className="h-8 w-8 shrink-0 rounded bg-muted flex items-center justify-center">
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{contract.customer_name}</p>
              <p className="text-xs text-muted-foreground">{contract.qr_code}</p>
            </div>
            <span
              className={cn(
                'shrink-0 w-2 h-2 rounded-full',
                contract.status === 'OVERDUE' && 'bg-red-500',
                contract.status === 'ACTIVE' && 'bg-green-500',
                contract.status === 'EXTENDED' && 'bg-blue-500',
                contract.status === 'DRAFT' && 'bg-gray-400'
              )}
              title={status.label}
            />
          </Link>
        )
      })}
    </div>
  )
}
