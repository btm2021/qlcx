'use server'

import { createClient } from '@/lib/supabase/server'
import type { Customer } from '@/types'

// Type for creating a customer
export interface CreateCustomerInput {
  full_name: string
  phone?: string
  email?: string
  address?: string
  id_card_type: 'CMND' | 'CCCD' | 'PASSPORT' | 'OTHER'
  id_card_number: string
  id_card_issued_date?: string
  id_card_issued_place?: string
  date_of_birth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  id_card_front_image?: string
  id_card_back_image?: string
  portrait_image?: string
  notes?: string
}

// Type for updating a customer
export type UpdateCustomerInput = Partial<CreateCustomerInput>

// Create a new customer
export async function createCustomer(data: CreateCustomerInput) {
  const supabase = await createClient()

  try {
    // Check if customer with same ID card number already exists
    if (data.id_card_number) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('id_card_number', data.id_card_number)
        .eq('is_active', true)
        .single()

      if (existing) {
        return {
          success: false,
          error: 'Khách hàng với số giấy tờ này đã tồn tại'
        }
      }
    }

    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        id_card_type: data.id_card_type,
        id_card_number: data.id_card_number,
        id_card_issued_date: data.id_card_issued_date || null,
        id_card_issued_place: data.id_card_issued_place || null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
        id_card_front_image: data.id_card_front_image || null,
        id_card_back_image: data.id_card_back_image || null,
        portrait_image: data.portrait_image || null,
        notes: data.notes || null,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating customer:', error)
      return {
        success: false,
        error: 'Có lỗi xảy ra khi tạo khách hàng'
      }
    }

    return {
      success: true,
      customerId: customer.id
    }
  } catch (error) {
    console.error('Error in createCustomer:', error)
    return {
      success: false,
      error: 'Có lỗi xảy ra khi tạo khách hàng'
    }
  }
}

// Update an existing customer
export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const supabase = await createClient()

  try {
    // Check if customer exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id, id_card_number')
      .eq('id', id)
      .single()

    if (!existing) {
      return {
        success: false,
        error: 'Khách hàng không tồn tại'
      }
    }

    // Check if new ID card number conflicts with another customer
    if (data.id_card_number && data.id_card_number !== existing.id_card_number) {
      const { data: duplicate } = await supabase
        .from('customers')
        .select('id')
        .eq('id_card_number', data.id_card_number)
        .eq('is_active', true)
        .neq('id', id)
        .single()

      if (duplicate) {
        return {
          success: false,
          error: 'Số giấy tờ này đã được sử dụng bởi khách hàng khác'
        }
      }
    }

    const updateData: Partial<Customer> = {}

    if (data.full_name !== undefined) updateData.full_name = data.full_name
    if (data.phone !== undefined) updateData.phone = data.phone || null
    if (data.email !== undefined) updateData.email = data.email || null
    if (data.address !== undefined) updateData.address = data.address || null
    if (data.id_card_type !== undefined) updateData.id_card_type = data.id_card_type
    if (data.id_card_number !== undefined) updateData.id_card_number = data.id_card_number
    if (data.id_card_issued_date !== undefined) updateData.id_card_issued_date = data.id_card_issued_date || null
    if (data.id_card_issued_place !== undefined) updateData.id_card_issued_place = data.id_card_issued_place || null
    if (data.date_of_birth !== undefined) updateData.date_of_birth = data.date_of_birth || null
    if (data.gender !== undefined) updateData.gender = data.gender || null
    if (data.id_card_front_image !== undefined) updateData.id_card_front_image = data.id_card_front_image || null
    if (data.id_card_back_image !== undefined) updateData.id_card_back_image = data.id_card_back_image || null
    if (data.portrait_image !== undefined) updateData.portrait_image = data.portrait_image || null
    if (data.notes !== undefined) updateData.notes = data.notes || null

    const { error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating customer:', error)
      return {
        success: false,
        error: 'Có lỗi xảy ra khi cập nhật khách hàng'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error in updateCustomer:', error)
    return {
      success: false,
      error: 'Có lỗi xảy ra khi cập nhật khách hàng'
    }
  }
}

// Search customers for dropdown/combobox
export async function searchCustomers(query: string, limit: number = 10) {
  const supabase = await createClient()

  try {
    let dbQuery = supabase
      .from('customers')
      .select('id, full_name, phone, id_card_number, id_card_type')
      .eq('is_active', true)
      .order('full_name')
      .limit(limit)

    if (query) {
      dbQuery = dbQuery.or(`full_name.ilike.%${query}%,phone.ilike.%${query}%,id_card_number.ilike.%${query}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Error searching customers:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchCustomers:', error)
    return []
  }
}

// Get a single customer by ID
export async function getCustomerById(id: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching customer:', error)
      return null
    }

    return data as Customer
  } catch (error) {
    console.error('Error in getCustomerById:', error)
    return null
  }
}

// Soft delete a customer (set is_active to false)
export async function deleteCustomer(id: string) {
  const supabase = await createClient()

  try {
    // Check if customer has any active contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id')
      .eq('customer_id', id)
      .in('status', ['DRAFT', 'ACTIVE', 'EXTENDED', 'OVERDUE'])

    if (contracts && contracts.length > 0) {
      return {
        success: false,
        error: 'Không thể xóa khách hàng đang có hợp đồng hoạt động'
      }
    }

    const { error } = await supabase
      .from('customers')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting customer:', error)
      return {
        success: false,
        error: 'Có lỗi xảy ra khi xóa khách hàng'
      }
    }

    return {
      success: true
    }
  } catch (error) {
    console.error('Error in deleteCustomer:', error)
    return {
      success: false,
      error: 'Có lỗi xảy ra khi xóa khách hàng'
    }
  }
}
