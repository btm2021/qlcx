'use client'

import Link from 'next/link'
import { Customer } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Phone, CreditCard, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomerCardProps {
  customer: Customer
  className?: string
}

export function CustomerCard({ customer, className }: CustomerCardProps) {
  // Generate initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get ID card type label
  const getIdCardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CMND: 'CMND',
      CCCD: 'CCCD',
      PASSPORT: 'Hộ chiếu',
      OTHER: 'Khác'
    }
    return labels[type] || type
  }

  return (
    <Link href={`/customers/${customer.id}`}>
      <Card className={cn(
        "cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {customer.portrait_image ? (
                <img
                  src={customer.portrait_image}
                  alt={customer.full_name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {getInitials(customer.full_name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">
                {customer.full_name}
              </h3>

              <div className="mt-2 space-y-1">
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{customer.phone}</span>
                  </div>
                )}

                {customer.id_card_number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {getIdCardTypeLabel(customer.id_card_type)}: {customer.id_card_number}
                    </span>
                  </div>
                )}

                {!customer.phone && !customer.id_card_number && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Chưa có thông tin liên hệ</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
