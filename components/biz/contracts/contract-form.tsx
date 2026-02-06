"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, User } from "lucide-react"
import {
  VEHICLE_CATEGORIES,
  VEHICLE_CATEGORY_NAMES,
  CONTRACT_TYPES,
  CONTRACT_TYPE_NAMES,
} from "@/lib/constants"
import type { Customer } from "@/types"

const contractFormSchema = z.object({
  customer_id: z.string().uuid({ message: "Vui lòng chọn khách hàng" }),
  vehicle_category_code: z.string().min(1, { message: "Vui lòng chọn loại xe" }),
  contract_type_code: z.string().min(1, { message: "Vui lòng chọn loại hợp đồng" }),
  appraised_value: z.number().min(0).optional(),
  loan_amount: z.number().min(0).optional(),
  interest_rate: z.number().min(0).max(100).optional(),
  duration_days: z.number().int().min(1).optional(),
  notes: z.string().optional(),
})

export type ContractFormData = z.infer<typeof contractFormSchema>

interface ContractFormProps {
  customers: Customer[]
  onSubmit: (data: ContractFormData) => void | Promise<void>
}

export function ContractForm({
  customers,
  onSubmit,
}: ContractFormProps) {
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState("")
  const [showCustomerSearch, setShowCustomerSearch] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      vehicle_category_code: "",
      contract_type_code: "",
      duration_days: 30,
      interest_rate: 3,
    },
  })

  const vehicleCategoryCode = watch("vehicle_category_code")
  const contractTypeCode = watch("contract_type_code")

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery) ||
      customer.id_card_number?.includes(searchQuery)
  )

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setValue("customer_id", customer.id, { shouldValidate: true })
    setShowCustomerSearch(false)
    setSearchQuery("")
  }

  const handleCustomerClear = () => {
    setSelectedCustomer(null)
    setValue("customer_id", "", { shouldValidate: true })
  }

  const onFormSubmit = async (data: ContractFormData) => {
    setSubmitError(null)
    startTransition(async () => {
      try {
        await onSubmit(data)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Có lỗi xảy ra")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {submitError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          {submitError}
        </div>
      )}

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedCustomer.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCustomer.phone}
                    {selectedCustomer.id_card_number &&
                      ` - ${selectedCustomer.id_card_number}`}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCustomerClear}
              >
                Đổi
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, SĐT hoặc CMND/CCCD..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowCustomerSearch(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowCustomerSearch(searchQuery.length > 0)}
                  className="pl-10"
                />
              </div>

              {showCustomerSearch && (
                <div className="border rounded-lg max-h-48 overflow-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => handleCustomerSelect(customer)}
                        className="w-full px-4 py-3 text-left hover:bg-muted border-b last:border-b-0 flex items-center gap-3"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{customer.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {customer.phone || "Chưa có SĐT"}
                            {customer.id_card_number && ` - ${customer.id_card_number}`}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Không tìm thấy khách hàng
                    </div>
                  )}
                </div>
              )}

              <input type="hidden" {...register("customer_id")} />
              {errors.customer_id && (
                <p className="text-sm text-destructive">{errors.customer_id.message}</p>
              )}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  // TODO: Open customer creation modal
                  alert("Tính năng tạo khách hàng mới sẽ được triển khai sau")
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Thêm khách hàng mới
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Category & Contract Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin hợp đồng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle_category_code">Loại xe *</Label>
              <Select
                value={vehicleCategoryCode}
                onValueChange={(value) =>
                  setValue("vehicle_category_code", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="vehicle_category_code">
                  <SelectValue placeholder="Chọn loại xe" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VEHICLE_CATEGORIES).map(([code, value]) => (
                    <SelectItem key={code} value={value}>
                      {VEHICLE_CATEGORY_NAMES[code as keyof typeof VEHICLE_CATEGORY_NAMES]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_category_code && (
                <p className="text-sm text-destructive">
                  {errors.vehicle_category_code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract_type_code">Loại hợp đồng *</Label>
              <Select
                value={contractTypeCode}
                onValueChange={(value) =>
                  setValue("contract_type_code", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="contract_type_code">
                  <SelectValue placeholder="Chọn loại hợp đồng" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CONTRACT_TYPES).map(([code, value]) => (
                    <SelectItem key={code} value={value}>
                      {CONTRACT_TYPE_NAMES[code as keyof typeof CONTRACT_TYPE_NAMES]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.contract_type_code && (
                <p className="text-sm text-destructive">
                  {errors.contract_type_code.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin tài chính</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appraised_value">Giá trị thẩm định (VND)</Label>
              <Input
                id="appraised_value"
                type="number"
                placeholder="Nhập giá trị thẩm định"
                {...register("appraised_value", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan_amount">Số tiền cho vay (VND)</Label>
              <Input
                id="loan_amount"
                type="number"
                placeholder="Nhập số tiền cho vay"
                {...register("loan_amount", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Lãi suất (%/tháng)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                placeholder="3.00"
                {...register("interest_rate", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_days">Thời hạn (ngày)</Label>
              <Input
                id="duration_days"
                type="number"
                placeholder="30"
                {...register("duration_days", { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ghi chú</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            id="notes"
            placeholder="Nhập ghi chú (nếu có)"
            {...register("notes")}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={isPending || !selectedCustomer}
        >
          {isPending ? "Đang tạo..." : "Tạo hợp đồng"}
        </Button>
      </div>
    </form>
  )
}
