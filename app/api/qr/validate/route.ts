import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/qr/validate
 * Validate a QR code and return contract information
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { qr_code } = body

    if (!qr_code || typeof qr_code !== 'string') {
      return NextResponse.json(
        { error: 'QR code is required' },
        { status: 400 }
      )
    }

    // Query contract by QR code using the v_active_contracts view
    const { data: contract, error } = await supabase
      .from('v_active_contracts')
      .select('*')
      .eq('qr_code', qr_code)
      .single()

    if (error || !contract) {
      // Try to find in all contracts (including non-active)
      const { data: anyContract, error: anyError } = await supabase
        .from('contracts')
        .select(`
          *,
          customer:customers(full_name, phone),
          vehicle_category:vehicle_categories(code, name),
          contract_type:contract_types(code, name)
        `)
        .eq('qr_code', qr_code)
        .single()

      if (anyError || !anyContract) {
        return NextResponse.json(
          { error: 'Contract not found', qr_code },
          { status: 404 }
        )
      }

      return NextResponse.json({
        found: true,
        active: false,
        contract: anyContract
      })
    }

    // Get vehicle details
    const { data: vehicle } = await supabase
      .from('vehicles')
      .select('*')
      .eq('contract_id', contract.id)
      .single()

    return NextResponse.json({
      found: true,
      active: true,
      contract: {
        ...contract,
        vehicle
      }
    })

  } catch (error) {
    console.error('QR validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
