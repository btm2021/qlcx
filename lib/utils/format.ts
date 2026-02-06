/**
 * Format utilities for Vietnamese locale
 * Currency, dates, and other formatting helpers
 */

/**
 * Format a number as Vietnamese Dong (VND)
 * Example: 1000000 -> "1.000.000 d"
 * @param amount - The amount to format
 * @param showSymbol - Whether to show the currency symbol (default: true)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null | undefined, showSymbol = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '0 d' : '0'
  }

  const formatted = new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

  return showSymbol ? `${formatted} d` : formatted
}

/**
 * Format a number as compact currency (for large numbers)
 * Example: 1500000 -> "1,5 trieu"
 * @param amount - The amount to format
 * @returns Formatted compact currency string
 */
export function formatCurrencyCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 d'
  }

  const absAmount = Math.abs(amount)

  if (absAmount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} ty`.replace('.', ',')
  }

  if (absAmount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} trieu`.replace('.', ',')
  }

  if (absAmount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)} nghin`.replace('.', ',')
  }

  return formatCurrency(amount)
}

/**
 * Format a date as dd/MM/yyyy
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) {
    return '-'
  }

  try {
    const d = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date

    if (isNaN(d.getTime())) {
      return '-'
    }

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    return `${day}/${month}/${year}`
  } catch {
    return '-'
  }
}

/**
 * Format a date as dd/MM/yyyy HH:mm
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @returns Formatted datetime string
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) {
    return '-'
  }

  try {
    const d = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date

    if (isNaN(d.getTime())) {
      return '-'
    }

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return '-'
  }
}

/**
 * Format a date as dd/MM/yyyy HH:mm:ss
 * @param date - Date to format (Date object, ISO string, or timestamp)
 * @returns Formatted datetime string with seconds
 */
export function formatDateTimeSeconds(date: Date | string | number | null | undefined): string {
  if (!date) {
    return '-'
  }

  try {
    const d = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date

    if (isNaN(d.getTime())) {
      return '-'
    }

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
  } catch {
    return '-'
  }
}

/**
 * Format a time as HH:mm
 * @param date - Date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | number | null | undefined): string {
  if (!date) {
    return '-'
  }

  try {
    const d = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date

    if (isNaN(d.getTime())) {
      return '-'
    }

    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${hours}:${minutes}`
  } catch {
    return '-'
  }
}

/**
 * Format a relative time (e.g., "2 ngay truoc", "hom nay")
 * @param date - Date to format
 * @returns Relative time string in Vietnamese
 */
export function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) {
    return '-'
  }

  try {
    const d = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date

    if (isNaN(d.getTime())) {
      return '-'
    }

    const now = new Date()
    const diffInMs = now.getTime() - d.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

    if (diffInMinutes < 1) {
      return 'vua xong'
    }

    if (diffInMinutes < 60) {
      return `${diffInMinutes} phut truoc`
    }

    if (diffInHours < 24) {
      return `${diffInHours} gio truoc`
    }

    if (diffInDays === 0) {
      return 'hom nay'
    }

    if (diffInDays === 1) {
      return 'hom qua'
    }

    if (diffInDays < 7) {
      return `${diffInDays} ngay truoc`
    }

    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7)
      return `${weeks} tuan truoc`
    }

    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} thang truoc`
    }

    const years = Math.floor(diffInDays / 365)
    return `${years} nam truoc`
  } catch {
    return '-'
  }
}

/**
 * Format a number with thousand separators
 * @param value - Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }

  return new Intl.NumberFormat('vi-VN').format(value)
}

/**
 * Format a percentage
 * @param value - Percentage value (e.g., 3.5 for 3.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }

  return `${value.toFixed(decimals)}%`.replace('.', ',')
}

/**
 * Format a phone number for display
 * Example: 0912345678 -> "0912 345 678"
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) {
    return '-'
  }

  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }

  return phone
}

/**
 * Format an ID card number (CMND/CCCD) for display
 * @param idCard - ID card number
 * @returns Formatted ID card number
 */
export function formatIdCard(idCard: string | null | undefined): string {
  if (!idCard) {
    return '-'
  }

  const cleaned = idCard.replace(/\D/g, '')

  // CCCD (12 digits): XXX XXX XXX XXX
  if (cleaned.length === 12) {
    return cleaned.match(/.{1,3}/g)?.join(' ') || idCard
  }

  // CMND (9 digits): XXX XXX XXX
  if (cleaned.length === 9) {
    return cleaned.match(/.{1,3}/g)?.join(' ') || idCard
  }

  return idCard
}
