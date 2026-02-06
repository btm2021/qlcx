// Vehicle Category Codes
export const VEHICLE_CATEGORIES = {
  CAR: 'CAR',   // Ô tô con
  MTR: 'MTR',   // Xe máy/Mô tô
  TRK: 'TRK',   // Xe tải
  VAN: 'VAN',   // Xe van/Thương mại
  BIK: 'BIK',   // Xe đạp/Xe điện
  SPE: 'SPE',   // Phương tiện đặc biệt
} as const

export type VehicleCategoryCode = keyof typeof VEHICLE_CATEGORIES

export const VEHICLE_CATEGORY_NAMES: Record<VehicleCategoryCode, string> = {
  CAR: 'Ô tô con',
  MTR: 'Xe máy / Mô tô',
  TRK: 'Xe tải',
  VAN: 'Xe van / Thương mại',
  BIK: 'Xe đạp / Xe điện',
  SPE: 'Phương tiện đặc biệt',
}

// Contract Type Codes
export const CONTRACT_TYPES = {
  PAWN: 'PAWN',       // Cầm đồ
  RENTAL: 'RENTAL',   // Cho thuê/Cầm xe
  SALE: 'SALE',       // Mua bán có điều kiện
  LEASE: 'LEASE',     // Thuê dài hạn
  CONSIGN: 'CONSIGN', // Ký gửi bán
} as const

export type ContractTypeCode = keyof typeof CONTRACT_TYPES

export const CONTRACT_TYPE_NAMES: Record<ContractTypeCode, string> = {
  PAWN: 'Cầm đồ',
  RENTAL: 'Cho thuê / Cầm xe',
  SALE: 'Mua bán có điều kiện',
  LEASE: 'Thuê dài hạn',
  CONSIGN: 'Ký gửi bán',
}

// Contract Status
export const CONTRACT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXTENDED: 'EXTENDED',
  OVERDUE: 'OVERDUE',
  REDEEMED: 'REDEEMED',
  LIQUIDATING: 'LIQUIDATING',
  LIQUIDATED: 'LIQUIDATED',
  CANCELLED: 'CANCELLED',
} as const

export type ContractStatus = keyof typeof CONTRACT_STATUS

export const CONTRACT_STATUS_NAMES: Record<ContractStatus, string> = {
  DRAFT: 'Nháp',
  ACTIVE: 'Đang hoạt động',
  EXTENDED: 'Đã gia hạn',
  OVERDUE: 'Quá hạn',
  REDEEMED: 'Đã chuộc',
  LIQUIDATING: 'Đang thanh lý',
  LIQUIDATED: 'Đã thanh lý',
  CANCELLED: 'Đã hủy',
}

// Inspection Results
export const INSPECTION_RESULT = {
  PRESENT: 'PRESENT',
  MISSING: 'MISSING',
} as const

export type InspectionResult = keyof typeof INSPECTION_RESULT

export const INSPECTION_RESULT_NAMES: Record<InspectionResult, string> = {
  PRESENT: 'Có mặt',
  MISSING: 'Không có mặt',
}

// Image Types
export const IMAGE_TYPE = {
  RECEIVING: 'RECEIVING',
  INSPECTION: 'INSPECTION',
  RETURNING: 'RETURNING',
  DAMAGE: 'DAMAGE',
  DOCUMENT: 'DOCUMENT',
  OTHER: 'OTHER',
} as const

export type ImageType = keyof typeof IMAGE_TYPE

// Staff Roles
export const STAFF_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const

export type StaffRole = keyof typeof STAFF_ROLE

// Payment Types
export const PAYMENT_TYPE = {
  INTEREST: 'INTEREST',
  PARTIAL: 'PARTIAL',
  FULL_REDEEM: 'FULL_REDEEM',
  EXTENSION_FEE: 'EXTENSION_FEE',
  PENALTY: 'PENALTY',
  OTHER: 'OTHER',
} as const

export type PaymentType = keyof typeof PAYMENT_TYPE

// Payment Methods
export const PAYMENT_METHOD = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  OTHER: 'OTHER',
} as const

export type PaymentMethod = keyof typeof PAYMENT_METHOD
