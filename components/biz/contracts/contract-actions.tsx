"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Package,
  RotateCcw,
  CheckCircle,
  Gavel,
  XCircle,
  Play,
  Loader2,
  Banknote,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  receiveAsset,
  extendContract,
  redeemContract,
  liquidateContract,
  cancelContract,
  activateContract,
} from "@/app/(dashboard)/contracts/[id]/actions"
import { recordPayment } from "@/app/(dashboard)/contracts/[id]/payments/actions"
import type { Contract, ContractPayment } from "@/types"

interface ContractActionsProps {
  contract: Contract
  onActionComplete?: () => void
}

export function ContractActions({ contract, onActionComplete }: ContractActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [redeemDialogOpen, setRedeemDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [liquidateDialogOpen, setLiquidateDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Form states
  const [extensionDays, setExtensionDays] = useState(30)
  const [redeemAmount, setRedeemAmount] = useState(contract.outstanding_balance || 0)
  const [redeemMethod, setRedeemMethod] = useState<"CASH" | "BANK_TRANSFER" | "OTHER">("CASH")
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [paymentType, setPaymentType] = useState<"INTEREST" | "PARTIAL" | "PENALTY" | "OTHER">("INTEREST")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "OTHER">("CASH")
  const [liquidateReason, setLiquidateReason] = useState("")
  const [cancelReason, setCancelReason] = useState("")
  const [notes, setNotes] = useState("")

  const isActive = ["ACTIVE", "EXTENDED", "OVERDUE"].includes(contract.status)
  const isDraft = contract.status === "DRAFT"

  async function handleReceiveAsset() {
    setIsLoading("receive")
    setError(null)
    try {
      await receiveAsset(contract.id)
      onActionComplete?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to receive asset")
    } finally {
      setIsLoading(null)
    }
  }

  async function handleExtend() {
    setIsLoading("extend")
    setError(null)
    try {
      await extendContract(contract.id, extensionDays)
      setExtendDialogOpen(false)
      onActionComplete?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend contract")
    } finally {
      setIsLoading(null)
    }
  }

  async function handleRedeem() {
    setIsLoading("redeem")
    setError(null)
    try {
      await redeemContract(contract.id, {
        amount: redeemAmount,
        paymentMethod: redeemMethod,
        notes,
      })
      setRedeemDialogOpen(false)
      onActionComplete?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to redeem contract")
    } finally {
      setIsLoading(null)
    }
  }

  async function handleLiquidate() {
    setIsLoading("liquidate")
    setError(null)
    try {
      await liquidateContract(contract.id, liquidateReason)
      setLiquidateDialogOpen(false)
      onActionComplete?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to liquidate contract")
    } finally {
      setIsLoading(null)
    }
  }

  async function handleCancel() {
    setIsLoading("cancel")
    setError(null)
    try {
      await cancelContract(contract.id, cancelReason)
      setCancelDialogOpen(false)
      onActionComplete?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel contract")
    } finally {
      setIsLoading(null)
    }
  }

  async function handleActivate() {
    setIsLoading("activate")
    setError(null)
    try {
      await activateContract(contract.id)
      onActionComplete?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate contract")
    } finally {
      setIsLoading(null)
    }
  }

  async function handleRecordPayment() {
    setIsLoading("payment")
    setError(null)
    try {
      await recordPayment(contract.id, {
        paymentType,
        paymentMethod,
        amount: paymentAmount,
        notes,
      })
      setPaymentDialogOpen(false)
      setPaymentAmount(0)
      setNotes("")
      onActionComplete?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {isActive && (
        <div className="flex flex-wrap gap-2">
          {/* Receive Asset Button */}
          {!contract.is_asset_received && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Package className="w-4 h-4 mr-2" />
                  Tiếp nhận tài sản
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận tiếp nhận tài sản</AlertDialogTitle>
                  <AlertDialogDescription>
                    Bạn có chắc chắn đã tiếp nhận tài sản vào kho? Hành động này sẽ ghi nhận thờigian và ngườitiếp nhận.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReceiveAsset}
                    disabled={isLoading === "receive"}
                  >
                    {isLoading === "receive" && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Xác nhận
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Record Payment Button */}
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Banknote className="w-4 h-4 mr-2" />
                Thu tiền
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Ghi nhận thanh toán</DialogTitle>
                <DialogDescription>
                  Nhập thông tin thanh toán cho hợp đồng {contract.qr_code}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="paymentType">Loại thanh toán</Label>
                  <Select
                    value={paymentType}
                    onValueChange={(v) => setPaymentType(v as typeof paymentType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTEREST">Trả lãi</SelectItem>
                      <SelectItem value="PARTIAL">Trả một phần gốc</SelectItem>
                      <SelectItem value="PENALTY">Phí phạt</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="paymentMethod">Phương thức</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Tiền mặt</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Số tiền (VND)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ghi chú về thanh toán (tùy chọn)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPaymentDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleRecordPayment}
                  disabled={isLoading === "payment" || paymentAmount <= 0}
                >
                  {isLoading === "payment" && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Ghi nhận
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Extend Button */}
          <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Gia hạn
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Gia hạn hợp đồng</DialogTitle>
                <DialogDescription>
                  Gia hạn thêm thời gian cho hợp đồng {contract.qr_code}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="extensionDays">Số ngày gia hạn</Label>
                  <Input
                    id="extensionDays"
                    type="number"
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(Number(e.target.value))}
                    min={1}
                    max={365}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Ngày đáo hạn hiện tại: {contract.due_date || "Chưa có"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Số lần đã gia hạn: {contract.extension_count}
                </p>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setExtendDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleExtend}
                  disabled={isLoading === "extend" || extensionDays <= 0}
                >
                  {isLoading === "extend" && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Gia hạn
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Redeem Button */}
          <Dialog open={redeemDialogOpen} onOpenChange={setRedeemDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Chuộc tài sản
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Chuộc tài sản</DialogTitle>
                <DialogDescription>
                  Khách hàng chuộc lại tài sản cho hợp đồng {contract.qr_code}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Dư nợ còn lại</p>
                  <p className="text-xl font-bold">
                    {contract.outstanding_balance?.toLocaleString("vi-VN")} VND
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="redeemAmount">Số tiền thanh toán (VND)</Label>
                  <Input
                    id="redeemAmount"
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="redeemMethod">Phương thức thanh toán</Label>
                  <Select
                    value={redeemMethod}
                    onValueChange={(v) => setRedeemMethod(v as typeof redeemMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Tiền mặt</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Chuyển khoản</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="redeemNotes">Ghi chú</Label>
                  <Input
                    id="redeemNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ghi chú về việc chuộc tài sản (tùy chọn)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRedeemDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleRedeem}
                  disabled={isLoading === "redeem" || redeemAmount <= 0}
                >
                  {isLoading === "redeem" && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Xác nhận chuộc
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Liquidate Button */}
          <Dialog open={liquidateDialogOpen} onOpenChange={setLiquidateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Gavel className="w-4 h-4 mr-2" />
                Thanh lý
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Thanh lý tài sản
                </DialogTitle>
                <DialogDescription>
                  Cảnh báo: Hành động này sẽ đánh dấu hợp đồng là đã thanh lý. Tàisản sẽ không còn trong kho.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="text-sm text-red-700">
                    <strong>Lưu ý:</strong> Thanh lý đồng nghĩa với việc tài sản đã được bán hoặc xử lý. Hợp đồng sẽ kết thúc.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="liquidateReason">Lý do thanh lý</Label>
                  <Input
                    id="liquidateReason"
                    value={liquidateReason}
                    onChange={(e) => setLiquidateReason(e.target.value)}
                    placeholder="Nhập lý do thanh lý (bắt buộc)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setLiquidateDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLiquidate}
                  disabled={isLoading === "liquidate" || !liquidateReason.trim()}
                >
                  {isLoading === "liquidate" && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Xác nhận thanh lý
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {isDraft && (
        <div className="flex flex-wrap gap-2">
          {/* Activate Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="default" size="sm">
                <Play className="w-4 h-4 mr-2" />
                Kích hoạt
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kích hoạt hợp đồng</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn kích hoạt hợp đồng này? Sau khi kích hoạt, hợp đồng sẽ chuyển sang trạng thái "Đang hoạt động".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleActivate}
                  disabled={isLoading === "activate"}
                >
                  {isLoading === "activate" && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Kích hoạt
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Cancel Button */}
          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <XCircle className="w-4 h-4 mr-2" />
                Hủy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Hủy hợp đồng
                </DialogTitle>
                <DialogDescription>
                  Hủy hợp đồng nháp này. Hành động này không thể hoàn tác.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="cancelReason">Lý do hủy</Label>
                  <Input
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nhập lý do hủy hợp đồng (tùy chọn)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCancelDialogOpen(false)}
                >
                  Đóng
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={isLoading === "cancel"}
                >
                  {isLoading === "cancel" && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Xác nhận hủy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}
