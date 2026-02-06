import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'

/**
 * GET /api/reports/daily?date=2026-02-06
 * Get daily report: contracts created, payments received, inspections done
 */
export async function GET(request: NextRequest) {
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

    // Get date parameter (default to today)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const reportDate = dateParam ? parseISO(dateParam) : new Date()

    const dateStr = format(reportDate, 'yyyy-MM-dd')

    // Get start and end of day
    const startDate = startOfDay(reportDate)
    const endDate = endOfDay(reportDate)

    // Fetch contracts created today
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select(`
        id,
        qr_code,
        loan_amount,
        status,
        customer:customers(full_name),
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError)
      return NextResponse.json(
        { error: 'Failed to fetch contracts' },
        { status: 500 }
      )
    }

    // Fetch payments received today
    const { data: payments, error: paymentsError } = await supabase
      .from('contract_payments')
      .select(`
        id,
        amount,
        payment_type,
        payment_method,
        contract:contracts(qr_code, customer:customers(full_name)),
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    // Fetch inspections done today
    const { data: inspections, error: inspectionsError } = await supabase
      .from('inspection_logs')
      .select(`
        id,
        result,
        gps_latitude,
        gps_longitude,
        contract:contracts(qr_code),
        staff:staff(full_name),
        inspected_at
      `)
      .gte('inspected_at', startDate.toISOString())
      .lte('inspected_at', endDate.toISOString())
      .order('inspected_at', { ascending: false })

    if (inspectionsError) {
      console.error('Error fetching inspections:', inspectionsError)
      return NextResponse.json(
        { error: 'Failed to fetch inspections' },
        { status: 500 }
      )
    }

    // Calculate totals
    const totalContracts = contracts?.length || 0
    const totalLoanAmount = contracts?.reduce((sum, c) => sum + (c.loan_amount || 0), 0) || 0
    const totalPayments = payments?.length || 0
    const totalPaymentAmount = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const totalInspections = inspections?.length || 0
    const presentCount = inspections?.filter(i => i.result === 'PRESENT').length || 0
    const missingCount = inspections?.filter(i => i.result === 'MISSING').length || 0

    return NextResponse.json({
      date: dateStr,
      summary: {
        contracts: {
          count: totalContracts,
          totalLoanAmount
        },
        payments: {
          count: totalPayments,
          totalAmount: totalPaymentAmount
        },
        inspections: {
          count: totalInspections,
          present: presentCount,
          missing: missingCount
        }
      },
      contracts: contracts || [],
      payments: payments || [],
      inspections: inspections || []
    })

  } catch (error) {
    console.error('Daily report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
