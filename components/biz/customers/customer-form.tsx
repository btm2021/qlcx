'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Camera, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// Validation schema
const customerFormSchema = z.object({
  full_name: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ (10-11 số)')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional(),
  id_card_type: z.enum(['CMND', 'CCCD', 'PASSPORT', 'OTHER']),
  id_card_number: z.string().min(1, 'Số giấy tờ là bắt buộc'),
  id_card_issued_date: z.string().optional(),
  id_card_issued_place: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  id_card_front_image: z.string().optional(),
  id_card_back_image: z.string().optional(),
  portrait_image: z.string().optional(),
  notes: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerFormSchema>

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>
  onSubmit: (data: CustomerFormData) => void
  isLoading?: boolean
}

interface PhotoUploadProps {
  label: string
  value?: string
  onChange: (url: string) => void
  aspectRatio?: 'landscape' | 'portrait' | 'square'
}

function PhotoUpload({ label, value, onChange, aspectRatio = 'landscape' }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)

  const aspectClasses = {
    landscape: 'aspect-[3/2]',
    portrait: 'aspect-[2/3]',
    square: 'aspect-square'
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    setIsUploading(true)

    try {
      const supabase = createClient()
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `customers/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('customer-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('customer-documents')
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      onChange(publicUrl)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Có lỗi xảy ra khi tải ảnh lên')
    } finally {
      setIsUploading(false)
    }
  }, [onChange])

  const handleRemove = useCallback(() => {
    setPreview(null)
    onChange('')
  }, [onChange])

  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      {preview ? (
        <div className={cn("relative rounded-lg border overflow-hidden", aspectClasses[aspectRatio])}>
          <img
            src={preview}
            alt={label}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
          aspectClasses[aspectRatio]
        )}>
          <div className="flex flex-col items-center justify-center pb-6 pt-5">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Chụp hoặc chọn ảnh</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  )
}

export function CustomerForm({ initialData, onSubmit, isLoading }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      address: initialData?.address || '',
      id_card_type: initialData?.id_card_type || 'CCCD',
      id_card_number: initialData?.id_card_number || '',
      id_card_issued_date: initialData?.id_card_issued_date || '',
      id_card_issued_place: initialData?.id_card_issued_place || '',
      date_of_birth: initialData?.date_of_birth || '',
      gender: initialData?.gender || undefined,
      id_card_front_image: initialData?.id_card_front_image || '',
      id_card_back_image: initialData?.id_card_back_image || '',
      portrait_image: initialData?.portrait_image || '',
      notes: initialData?.notes || '',
    }
  })

  const idCardType = watch('id_card_type')
  const idCardFrontImage = watch('id_card_front_image')
  const idCardBackImage = watch('id_card_back_image')
  const portraitImage = watch('portrait_image')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">
                Họ và tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                placeholder="Nhập họ và tên"
                {...register('full_name')}
                className={cn(errors.full_name && "border-destructive")}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                placeholder="Nhập số điện thoại"
                {...register('phone')}
                className={cn(errors.phone && "border-destructive")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email"
                {...register('email')}
                className={cn(errors.email && "border-destructive")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                placeholder="Nhập địa chỉ"
                {...register('address')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ID Card Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin giấy tờ tùy thân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="id_card_type">Loại giấy tờ</Label>
              <Select
                value={idCardType}
                onValueChange={(value: 'CMND' | 'CCCD' | 'PASSPORT' | 'OTHER') =>
                  setValue('id_card_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại giấy tờ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CMND">Chứng minh nhân dân</SelectItem>
                  <SelectItem value="CCCD">Căn cước công dân</SelectItem>
                  <SelectItem value="PASSPORT">Hộ chiếu</SelectItem>
                  <SelectItem value="OTHER">Giấy tờ khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_card_number">
                Số giấy tờ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="id_card_number"
                placeholder="Nhập số giấy tờ"
                {...register('id_card_number')}
                className={cn(errors.id_card_number && "border-destructive")}
              />
              {errors.id_card_number && (
                <p className="text-sm text-destructive">{errors.id_card_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_card_issued_date">Ngày cấp</Label>
              <Input
                id="id_card_issued_date"
                type="date"
                {...register('id_card_issued_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_card_issued_place">Nơi cấp</Label>
              <Input
                id="id_card_issued_place"
                placeholder="Nhập nơi cấp"
                {...register('id_card_issued_place')}
              />
            </div>
          </div>

          <Separator />

          {/* Photo Uploads */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PhotoUpload
              label="Ảnh mặt trước"
              value={idCardFrontImage}
              onChange={(url) => setValue('id_card_front_image', url)}
              aspectRatio="landscape"
            />
            <PhotoUpload
              label="Ảnh mặt sau"
              value={idCardBackImage}
              onChange={(url) => setValue('id_card_back_image', url)}
              aspectRatio="landscape"
            />
            <PhotoUpload
              label="Ảnh chân dung"
              value={portraitImage}
              onChange={(url) => setValue('portrait_image', url)}
              aspectRatio="portrait"
            />
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Ngày sinh</Label>
              <Input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select
                value={watch('gender')}
                onValueChange={(value: 'MALE' | 'FEMALE' | 'OTHER') =>
                  setValue('gender', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Nam</SelectItem>
                  <SelectItem value="FEMALE">Nữ</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Input
              id="notes"
              placeholder="Nhập ghi chú (nếu có)"
              {...register('notes')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu khách hàng'
          )}
        </Button>
      </div>
    </form>
  )
}
