// Database types based on the schema

export interface Staff {
  id: string
  staff_code: string
  full_name: string
  phone?: string
  email?: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF'
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone?: string
  email?: string
  address?: string
  id_card_type: 'CMND' | 'CCCD' | 'PASSPORT' | 'OTHER'
  id_card_number?: string
  id_card_issued_date?: string
  id_card_issued_place?: string
  id_card_expiry_date?: string
  date_of_birth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  id_card_front_image?: string
  id_card_back_image?: string
  portrait_image?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface VehicleCategory {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  default_loan_ratio: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ContractType {
  id: string
  code: string
  name: string
  description?: string
  default_duration_days?: number
  default_interest_rate?: number
  allow_extension: boolean
  max_extensions: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  qr_code: string
  customer_id: string
  vehicle_category_id: string
  contract_type_id: string
  created_by: string
  status: 'DRAFT' | 'ACTIVE' | 'EXTENDED' | 'OVERDUE' | 'REDEEMED' | 'LIQUIDATING' | 'LIQUIDATED' | 'CANCELLED'
  appraised_value?: number
  loan_amount?: number
  interest_rate?: number
  total_interest_paid: number
  total_amount_paid: number
  outstanding_balance: number
  contract_date: string
  start_date: string
  due_date?: string
  actual_end_date?: string
  extension_count: number
  sequence_number: number
  notes?: string
  is_asset_received: boolean
  received_at?: string
  received_by?: string
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  contract_id: string
  category_id: string
  brand?: string
  model?: string
  year_of_manufacture?: number
  color?: string
  license_plate?: string
  registration_number?: string
  engine_number?: string
  chassis_number?: string
  registration_date?: string
  registration_expiry_date?: string
  owner_name?: string
  storage_location?: string
  key_count: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface ContractImage {
  id: string
  contract_id: string
  image_type: 'RECEIVING' | 'INSPECTION' | 'RETURNING' | 'DAMAGE' | 'DOCUMENT' | 'OTHER'
  file_path: string
  file_name: string
  file_size?: number
  mime_type: string
  caption?: string
  sort_order: number
  uploaded_by: string
  uploaded_at: string
}

export interface InspectionLog {
  id: string
  contract_id: string
  staff_id: string
  result: 'PRESENT' | 'MISSING'
  gps_latitude?: number
  gps_longitude?: number
  gps_accuracy?: number
  missing_note?: string
  inspected_at: string
}

export interface ActivityLog {
  id: string
  log_timestamp: string
  staff_id: string
  contract_id?: string
  action: string
  note?: string
}

export interface ContractPayment {
  id: string
  contract_id: string
  payment_type: 'INTEREST' | 'PARTIAL' | 'FULL_REDEEM' | 'EXTENSION_FEE' | 'PENALTY' | 'OTHER'
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'OTHER'
  amount: number
  interest_amount: number
  principal_amount: number
  penalty_amount: number
  payment_date: string
  received_by: string
  notes?: string
  receipt_number?: string
  created_at: string
  updated_at: string
}

// View types
export interface ActiveContractView extends Contract {
  customer_name: string
  customer_phone?: string
  vehicle_category_code: string
  vehicle_category_name: string
  contract_type_code: string
  contract_type_name: string
  brand?: string
  model?: string
  license_plate?: string
  days_remaining?: number
  is_overdue: boolean
  created_by_name?: string
}

// Form types
export interface CreateContractInput {
  customer_id: string
  vehicle_category_code: string
  contract_type_code: string
  appraised_value?: number
  loan_amount?: number
  interest_rate?: number
  duration_days?: number
  notes?: string
}

export interface CreateInspectionInput {
  contract_id: string
  result: 'PRESENT' | 'MISSING'
  gps_latitude?: number
  gps_longitude?: number
  gps_accuracy?: number
  missing_note?: string
}

export interface ContractStatusHistory {
  id: string
  contract_id: string
  old_status?: 'DRAFT' | 'ACTIVE' | 'EXTENDED' | 'OVERDUE' | 'REDEEMED' | 'LIQUIDATING' | 'LIQUIDATED' | 'CANCELLED'
  new_status: 'DRAFT' | 'ACTIVE' | 'EXTENDED' | 'OVERDUE' | 'REDEEMED' | 'LIQUIDATING' | 'LIQUIDATED' | 'CANCELLED'
  changed_by: string
  changed_at: string
  reason?: string
}
