import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRCodeSVG } from "qrcode.react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { ActiveContractView } from "@/types"
import { CONTRACT_STATUS_NAMES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { Calendar, User, Car, Banknote } from "lucide-react"

interface ContractCardProps {
  contract: ActiveContractView
}

export function ContractCard({ contract }: ContractCardProps) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-500",
    ACTIVE: "bg-green-500",
    EXTENDED: "bg-blue-500",
    OVERDUE: "bg-red-500",
    REDEEMED: "bg-purple-500",
    LIQUIDATING: "bg-orange-500",
    LIQUIDATED: "bg-slate-500",
    CANCELLED: "bg-gray-400",
  }

  const isOverdue = contract.is_overdue || (contract.days_remaining !== undefined && contract.days_remaining < 0)
  const daysRemaining = contract.days_remaining ?? 0

  return (
    <Link href={`/contracts/${contract.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base truncate">{contract.qr_code}</h3>
                <Badge
                  variant="secondary"
                  className={cn("text-white text-xs", statusColors[contract.status] || "bg-gray-500")}
                >
                  {CONTRACT_STATUS_NAMES[contract.status as keyof typeof CONTRACT_STATUS_NAMES] || contract.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                <User className="w-3 h-3 inline mr-1" />
                {contract.customer_name}
              </p>
            </div>
            <div className="shrink-0">
              <QRCodeSVG
                value={contract.qr_code}
                size={48}
                level="M"
                className="rounded"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Car className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate">
              {contract.vehicle_category_name}
              {contract.brand && ` - ${contract.brand}`}
              {contract.model && ` ${contract.model}`}
            </span>
          </div>

          {contract.license_plate && (
            <p className="text-sm text-muted-foreground pl-6">
              BS: {contract.license_plate}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Banknote className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="font-medium">
              {contract.loan_amount?.toLocaleString("vi-VN")} VND
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <span
              className={cn(
                "text-xs",
                isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
              )}
            >
              {contract.due_date
                ? isOverdue
                  ? `Quá hạn ${Math.abs(daysRemaining)} ngày`
                  : `Còn ${daysRemaining} ngày`
                : "Không có hạn"}
            </span>
          </div>

          {contract.due_date && (
            <p className="text-xs text-muted-foreground pl-6">
              {format(new Date(contract.due_date), "dd/MM/yyyy", { locale: vi })}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
