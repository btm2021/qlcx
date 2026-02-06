/**
 * Calculation utilities for pawn shop operations
 * Interest, due dates, overdue calculations
 */

/**
 * Calculate interest amount
 * Formula: principal * (rate / 100) * (days / 30)
 * @param principal - Loan principal amount
 * @param rate - Monthly interest rate (percentage, e.g., 3 for 3%)
 * @param days - Number of days
 * @returns Interest amount
 */
export function calculateInterest(
  principal: number,
  rate: number,
  days: number
): number {
  if (principal <= 0 || rate <= 0 || days <= 0) {
    return 0
  }

  // Monthly interest = principal * (rate / 100)
  // Daily interest = monthly interest / 30
  const monthlyInterest = principal * (rate / 100)
  const dailyInterest = monthlyInterest / 30

  return Math.round(dailyInterest * days)
}

/**
 * Calculate total interest for a contract period
 * @param principal - Loan principal amount
 * @param rate - Monthly interest rate (percentage)
 * @param durationDays - Contract duration in days
 * @returns Total interest for the period
 */
export function calculateTotalInterest(
  principal: number,
  rate: number,
  durationDays: number
): number {
  return calculateInterest(principal, rate, durationDays)
}

/**
 * Calculate due date from start date and duration
 * @param startDate - Contract start date
 * @param durationDays - Duration in days
 * @returns Due date
 */
export function calculateDueDate(
  startDate: Date | string,
  durationDays: number
): Date {
  const start = typeof startDate === 'string'
    ? new Date(startDate)
    : new Date(startDate.getTime())

  start.setDate(start.getDate() + durationDays)

  return start
}

/**
 * Calculate days overdue from due date
 * @param dueDate - Contract due date
 * @returns Number of days overdue (0 if not overdue)
 */
export function calculateDaysOverdue(dueDate: Date | string | null): number {
  if (!dueDate) {
    return 0
  }

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const now = new Date()

  // Reset time to midnight for accurate day calculation
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const diffInMs = nowMidnight.getTime() - dueMidnight.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  return Math.max(0, diffInDays)
}

/**
 * Calculate days remaining until due date
 * @param dueDate - Contract due date
 * @returns Number of days remaining (negative if overdue)
 */
export function calculateDaysRemaining(dueDate: Date | string | null): number {
  if (!dueDate) {
    return 0
  }

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate
  const now = new Date()

  // Reset time to midnight for accurate day calculation
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const diffInMs = dueMidnight.getTime() - nowMidnight.getTime()

  return Math.floor(diffInMs / (1000 * 60 * 60 * 24))
}

/**
 * Calculate extension due date
 * @param currentDueDate - Current due date
 * @param extensionDays - Number of days to extend
 * @returns New due date
 */
export function calculateExtensionDueDate(
  currentDueDate: Date | string,
  extensionDays: number
): Date {
  const current = typeof currentDueDate === 'string'
    ? new Date(currentDueDate)
    : new Date(currentDueDate.getTime())

  current.setDate(current.getDate() + extensionDays)

  return current
}

/**
 * Calculate penalty amount for overdue contract
 * @param outstandingBalance - Outstanding balance
 * @param penaltyRate - Daily penalty rate (percentage, e.g., 0.1 for 0.1%)
 * @param daysOverdue - Number of days overdue
 * @returns Penalty amount
 */
export function calculatePenalty(
  outstandingBalance: number,
  penaltyRate: number,
  daysOverdue: number
): number {
  if (outstandingBalance <= 0 || penaltyRate <= 0 || daysOverdue <= 0) {
    return 0
  }

  const dailyPenalty = outstandingBalance * (penaltyRate / 100)

  return Math.round(dailyPenalty * daysOverdue)
}

/**
 * Calculate total amount to redeem a contract
 * @param principal - Original loan amount
 * @param interestRate - Monthly interest rate
 * @param daysElapsed - Days since contract started
 * @param totalPaid - Total amount already paid
 * @param penaltyAmount - Any penalty amount
 * @returns Total amount needed to redeem
 */
export function calculateRedeemAmount(
  principal: number,
  interestRate: number,
  daysElapsed: number,
  totalPaid: number = 0,
  penaltyAmount: number = 0
): number {
  const interest = calculateInterest(principal, interestRate, daysElapsed)
  const totalOwed = principal + interest + penaltyAmount

  return Math.max(0, totalOwed - totalPaid)
}

/**
 * Calculate loan amount based on appraised value and loan ratio
 * @param appraisedValue - Appraised value of asset
 * @param loanRatio - Loan ratio percentage (e.g., 70 for 70%)
 * @returns Maximum loan amount
 */
export function calculateMaxLoanAmount(
  appraisedValue: number,
  loanRatio: number
): number {
  if (appraisedValue <= 0 || loanRatio <= 0) {
    return 0
  }

  return Math.round(appraisedValue * (loanRatio / 100))
}

/**
 * Calculate monthly interest payment
 * @param principal - Loan principal
 * @param rate - Monthly interest rate
 * @returns Monthly interest amount
 */
export function calculateMonthlyInterest(
  principal: number,
  rate: number
): number {
  if (principal <= 0 || rate <= 0) {
    return 0
  }

  return Math.round(principal * (rate / 100))
}

/**
 * Calculate partial payment breakdown
 * @param paymentAmount - Total payment amount
 * @param outstandingInterest - Outstanding interest
 * @param outstandingPrincipal - Outstanding principal
 * @returns Breakdown of payment allocation
 */
export function calculatePaymentBreakdown(
  paymentAmount: number,
  outstandingInterest: number,
  outstandingPrincipal: number
): {
  interestAmount: number
  principalAmount: number
  remainingInterest: number
  remainingPrincipal: number
} {
  // Interest is paid first, then principal
  const interestAmount = Math.min(paymentAmount, outstandingInterest)
  const remainingForPrincipal = paymentAmount - interestAmount
  const principalAmount = Math.min(remainingForPrincipal, outstandingPrincipal)

  return {
    interestAmount,
    principalAmount,
    remainingInterest: outstandingInterest - interestAmount,
    remainingPrincipal: outstandingPrincipal - principalAmount
  }
}

/**
 * Check if a contract is nearing due date
 * @param dueDate - Contract due date
 * @param warningDays - Number of days before due to warn (default: 3)
 * @returns boolean indicating if contract is nearing due
 */
export function isNearingDueDate(
  dueDate: Date | string | null,
  warningDays: number = 3
): boolean {
  if (!dueDate) {
    return false
  }

  const daysRemaining = calculateDaysRemaining(dueDate)

  return daysRemaining >= 0 && daysRemaining <= warningDays
}

/**
 * Get contract status based on dates
 * @param dueDate - Contract due date
 * @param currentStatus - Current contract status
 * @returns Updated status or current status
 */
export function getContractStatusFromDates(
  dueDate: Date | string | null,
  currentStatus: string
): string {
  if (!dueDate || ['REDEEMED', 'LIQUIDATED', 'CANCELLED'].includes(currentStatus)) {
    return currentStatus
  }

  const daysOverdue = calculateDaysOverdue(dueDate)

  if (daysOverdue > 0) {
    return 'OVERDUE'
  }

  return currentStatus
}

/**
 * Format duration in days to human readable string
 * @param days - Number of days
 * @returns Human readable duration
 */
export function formatDuration(days: number): string {
  if (days < 30) {
    return `${days} ngay`
  }

  const months = Math.floor(days / 30)
  const remainingDays = days % 30

  if (remainingDays === 0) {
    return `${months} thang`
  }

  return `${months} thang ${remainingDays} ngay`
}
