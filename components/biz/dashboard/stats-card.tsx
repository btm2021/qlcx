import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
  className?: string
}

const variantStyles = {
  default: {
    icon: 'text-muted-foreground',
    value: 'text-foreground',
  },
  success: {
    icon: 'text-green-600',
    value: 'text-green-600',
  },
  warning: {
    icon: 'text-amber-600',
    value: 'text-amber-600',
  },
  danger: {
    icon: 'text-red-600',
    value: 'text-red-600',
  },
  info: {
    icon: 'text-blue-600',
    value: 'text-blue-600',
  },
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = 'default',
  loading = false,
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant]

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className={cn('h-4 w-4', styles.icon)} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-bold', styles.value)}>
            {value}
          </span>
        </div>

        {(description || trend) && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium',
                  trend.direction === 'up' && 'text-green-600',
                  trend.direction === 'down' && 'text-red-600',
                  trend.direction === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend.direction === 'up' && (
                  <TrendingUp className="h-3 w-3" />
                )}
                {trend.direction === 'down' && (
                  <TrendingDown className="h-3 w-3" />
                )}
                {trend.direction === 'neutral' && (
                  <Minus className="h-3 w-3" />
                )}
                {trend.value > 0 && '+'}
                {trend.value}%
              </span>
            )}
            {description && (
              <span className="text-muted-foreground">{description}</span>
            )}
            {trend?.label && (
              <span className="text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Pre-configured variants for common use cases

interface QuickStatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  loading?: boolean
}

export function ActiveContractsCard({ title, value, icon, loading }: QuickStatsCardProps) {
  return (
    <StatsCard
      title={title}
      value={value}
      icon={icon}
      variant="info"
      loading={loading}
    />
  )
}

export function OverdueContractsCard({ title, value, icon, loading }: QuickStatsCardProps) {
  return (
    <StatsCard
      title={title}
      value={value}
      icon={icon}
      variant="danger"
      loading={loading}
    />
  )
}

export function InspectionNeededCard({ title, value, icon, loading }: QuickStatsCardProps) {
  return (
    <StatsCard
      title={title}
      value={value}
      icon={icon}
      variant="warning"
      loading={loading}
    />
  )
}

export function TodayContractsCard({ title, value, icon, loading }: QuickStatsCardProps) {
  return (
    <StatsCard
      title={title}
      value={value}
      icon={icon}
      variant="success"
      loading={loading}
    />
  )
}
