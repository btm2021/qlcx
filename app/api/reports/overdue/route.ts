import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/reports/overdue
 * List all overdue contracts from v_active_contracts
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch overdue contracts from v_active_contracts view
    // where is_overdue = true OR status = 'OVERDUE'
    const { data: overdueContracts, error, count } = await supabase
      .from('v_active_contracts')
      .select('*', { count: 'exact' })
      .or('is_overdue.eq.true,status.eq.OVERDUE')
      .order('days_remaining', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching overdue contracts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch overdue contracts' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const totalOverdueAmount = overdueContracts?.reduce(
      (sum, c) => sum + (c.outstanding_balance || 0),
      0
    ) || 0

    const totalLoanAmount = overdueContracts?.reduce(
      (sum, c) => sum + (c.loan_amount || 0),
      0
    ) || 0

    // Group by days overdue
    const byDaysOverdue = {
      '1-7_days': overdueContracts?.filter(c => Math.abs(c.days_remaining) <= 7).length || 0,
      '8-30_days': overdueContracts?.filter(c => {
        const days = Math.abs(c.days_remaining)
        return days > 7 && days <= 30
      }).length || 0,
      '31-60_days': overdueContracts?.filter(c => {
        const days = Math.abs(c.days_remaining)
        return days > 30 && days <= 60
      }).length || 0,
      'over_60_days': overdueContracts?.filter(c => Math.abs(c.days_remaining) > 60).length || 0
    }

    return NextResponse.json({
      summary: {
        totalCount: count || 0,
        totalOverdueAmount,
        totalLoanAmount,
        byDaysOverdue
      },
      contracts: overdueContracts || [],
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Overdue report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
