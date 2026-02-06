'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Types based on database schema
export interface Customer {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  address: string | null
  id_card_type: 'CMND' | 'CCCD' | 'PASSPORT' | 'OTHER' | null
  id_card_number: string | null
  id_card_issued_date: string | null
  id_card_issued_place: string | null
  id_card_expiry_date: string | null
  date_of_birth: string | null
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null
  id_card_front_image: string | null
  id_card_back_image: string | null
  portrait_image: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  contract_count?: number
  total_loan_amount?: number
}

export interface CustomerFilters {
  search?: string
  isActive?: boolean
}

interface UseCustomersOptions {
  filters?: CustomerFilters
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const CUSTOMERS_QUERY_KEY = 'customers'

/**
 * Hook to fetch customers list with filtering and pagination
 */
export function useCustomers(options: UseCustomersOptions = {}) {
  const {
    filters = {},
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = options

  const supabase = createClient()

  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, { filters, page, limit, sortBy, sortOrder }],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })

      // Apply filters
      if (filters.search) {
        query = query.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,id_card_number.ilike.%${filters.search}%`)
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive)
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

      // Fetch contract counts for each customer
      const customerIds = data?.map(c => c.id) || []
      const { data: contractStats } = await supabase
        .from('contracts')
        .select('customer_id, loan_amount')
        .in('customer_id', customerIds)

      // Aggregate contract stats
      const statsMap = new Map<string, { count: number; totalLoan: number }>()
      contractStats?.forEach(contract => {
        const current = statsMap.get(contract.customer_id) || { count: 0, totalLoan: 0 }
        statsMap.set(contract.customer_id, {
          count: current.count + 1,
          totalLoan: current.totalLoan + (contract.loan_amount || 0)
        })
      })

      // Merge stats with customers
      const customersWithStats = data?.map(customer => ({
        ...customer,
        contract_count: statsMap.get(customer.id)?.count || 0,
        total_loan_amount: statsMap.get(customer.id)?.totalLoan || 0
      }))

      return {
        customers: customersWithStats as Customer[],
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
 * Hook to fetch a single customer by ID
 */
export function useCustomer(id: string | null) {
  const supabase = createClient()

  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, 'detail', id],
    queryFn: async () => {
      if (!id) {
        return null
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Fetch customer's contracts
      const { data: contracts } = await supabase
        .from('contracts')
        .select(`
          *,
          vehicle_category:vehicle_categories(code, name),
          contract_type:contract_types(code, name)
        `)
        .eq('customer_id', id)
        .order('created_at', { ascending: false })

      return {
        ...data,
        contracts: contracts || []
      } as Customer & { contracts: any[] }
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}

/**
 * Hook to create a new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] })
    }
  })
}

/**
 * Hook to update a customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates
    }: {
      id: string
      updates: Partial<Customer>
    }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY, 'detail', variables.id] })
    }
  })
}

/**
 * Hook to search customers (for autocomplete)
 */
export function useSearchCustomers(searchTerm: string, enabled: boolean = true) {
  const supabase = createClient()

  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, 'search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return []
      }

      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, phone, id_card_number')
        .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,id_card_number.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .limit(10)

      if (error) {
        throw new Error(error.message)
      }

      return data as Pick<Customer, 'id' | 'full_name' | 'phone' | 'id_card_number'>[]
    },
    enabled: enabled && searchTerm.length >= 2,
    staleTime: 1000 * 60 // 1 minute
  })
}

/**
 * Hook to get customer statistics
 */
export function useCustomerStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: [CUSTOMERS_QUERY_KEY, 'stats'],
    queryFn: async () => {
      const { count: totalCustomers, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      if (countError) {
        throw new Error(countError.message)
      }

      // Get customers with contracts
      const { data: customersWithContracts, error: contractsError } = await supabase
        .from('contracts')
        .select('customer_id', { count: 'exact' })

      if (contractsError) {
        throw new Error(contractsError.message)
      }

      const uniqueCustomersWithContracts = new Set(customersWithContracts?.map(c => c.customer_id))

      return {
        totalCustomers: totalCustomers || 0,
        customersWithContracts: uniqueCustomersWithContracts.size,
        customersWithoutContracts: (totalCustomers || 0) - uniqueCustomersWithContracts.size
      }
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  })
}
