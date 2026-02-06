'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Types based on database schema
export interface Contract {
  id: string
  qr_code: string
  status: string
  customer_id: string
  vehicle_category_id: string
  contract_type_id: string
  created_by: string
  appraised_value: number | null
  loan_amount: number | null
  interest_rate: number | null
  total_interest_paid: number
  total_amount_paid: number
  outstanding_balance: number
  contract_date: string
  start_date: string
  due_date: string | null
  actual_end_date: string | null
  extension_count: number
  sequence_number: number
  notes: string | null
  is_asset_received: boolean
  received_at: string | null
  received_by: string | null
  created_at: string
  updated_at: string
  // Joined fields from views
  customer_name?: string
  customer_phone?: string
  vehicle_category_code?: string
  vehicle_category_name?: string
  contract_type_code?: string
  contract_type_name?: string
  brand?: string
  model?: string
  license_plate?: string
  days_remaining?: number
  is_overdue?: boolean
  created_by_name?: string
}

export interface ContractFilters {
  status?: string[]
  category?: string
  type?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  isOverdue?: boolean
}

interface UseContractsOptions {
  filters?: ContractFilters
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const CONTRACTS_QUERY_KEY = 'contracts'

/**
 * Hook to fetch contracts list with filtering and pagination
 */
export function useContracts(options: UseContractsOptions = {}) {
  const {
    filters = {},
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options

  const supabase = createClient()

  return useQuery({
    queryKey: [CONTRACTS_QUERY_KEY, { filters, page, limit, sortBy, sortOrder }],
    queryFn: async () => {
      let query = supabase
        .from('v_active_contracts')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.category) {
        query = query.eq('vehicle_category_code', filters.category)
      }

      if (filters.type) {
        query = query.eq('contract_type_code', filters.type)
      }

      if (filters.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,qr_code.ilike.%${filters.search}%,license_plate.ilike.%${filters.search}%`)
      }

      if (filters.dateFrom) {
        query = query.gte('contract_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('contract_date', filters.dateTo)
      }

      if (filters.isOverdue) {
        query = query.eq('is_overdue', true)
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      return {
        contracts: data as Contract[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false
  })
}

/**
 * Hook to fetch a single contract by ID or QR code
 */
export function useContract(idOrQrCode: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: [CONTRACTS_QUERY_KEY, 'detail', idOrQrCode],
    queryFn: async () => {
      if (!idOrQrCode) {
        return null
      }

      // Try to find by QR code first
      let query = supabase
        .from('contracts')
        .select(`
          *,
          customer:customers(*),
          vehicle_category:vehicle_categories(*),
          contract_type:contract_types(*),
          vehicle:vehicles(*),
          created_by_staff:staff(full_name)
        `)

      // Check if it's a UUID or QR code
      if (idOrQrCode.includes('-') && idOrQrCode.length > 20) {
        // Likely a UUID
        query = query.eq('id', idOrQrCode)
      } else {
        // Likely a QR code
        query = query.eq('qr_code', idOrQrCode)
      }

      const { data, error } = await query.single()

      if (error) {
        throw new Error(error.message)
      }

      return data as Contract
    },
    enabled: !!idOrQrCode,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

/**
 * Hook to create a new contract
 */
export function useCreateContract() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (contractData: {
      customer_id: string
      vehicle_category_code: string
      contract_type_code: string
      appraised_value?: number
      loan_amount?: number
      interest_rate?: number
      duration_days?: number
      notes?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Unauthorized')
      }

      // Get staff ID from user
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (!staff) {
        throw new Error('Staff not found')
      }

      // Call the RPC function to create contract
      const { data, error } = await supabase
        .rpc('fn_create_contract', {
          p_customer_id: contractData.customer_id,
          p_vehicle_category_code: contractData.vehicle_category_code,
          p_contract_type_code: contractData.contract_type_code,
          p_created_by: staff.id,
          p_appraised_value: contractData.appraised_value || null,
          p_loan_amount: contractData.loan_amount || null,
          p_interest_rate: contractData.interest_rate || null,
          p_duration_days: contractData.duration_days || null,
          p_notes: contractData.notes || null
        })

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_QUERY_KEY] })
    }
  })
}

/**
 * Hook to update a contract
 */
export function useUpdateContract() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<Contract>
    }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CONTRACTS_QUERY_KEY, 'detail', variables.id] })
    }
  })
}

/**
 * Hook to get contract statistics
 */
export function useContractStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: [CONTRACTS_QUERY_KEY, 'stats'],
    queryFn: async () => {
      const [
        { count: totalActive },
        { count: totalOverdue },
        { count: totalDraft },
        { data: totalLoanAmount }
      ] = await Promise.all([
        supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .in('status', ['ACTIVE', 'EXTENDED']),
        supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'OVERDUE'),
        supabase
          .from('contracts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'DRAFT'),
        supabase
          .from('contracts')
          .select('loan_amount')
          .in('status', ['ACTIVE', 'EXTENDED', 'OVERDUE'])
      ])

      const totalLoan = totalLoanAmount?.reduce((sum, c) => sum + (c.loan_amount || 0), 0) || 0

      return {
        totalActive: totalActive || 0,
        totalOverdue: totalOverdue || 0,
        totalDraft: totalDraft || 0,
        totalLoanAmount: totalLoan
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
