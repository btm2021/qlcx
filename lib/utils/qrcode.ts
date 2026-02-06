/**
 * QR Code utilities for parsing and generating QR codes
 * Format: {CATEGORY}-{TYPE}-{YYYYMMDD}-{SEQUENCE}
 * Example: CAR-RENTAL-20260206-01
 */

export interface ParsedQRCode {
  category: string
  type: string
  date: string
  sequence: number
  raw: string
}

/**
 * Parse a QR code string into its components
 * @param qrCode - QR code string to parse
 * @returns ParsedQRCode object or null if invalid
 */
export function parseQRCode(qrCode: string | null | undefined): ParsedQRCode | null {
  if (!qrCode) {
    return null
  }

  // Normalize: remove spaces, uppercase
  const normalized = qrCode.trim().toUpperCase()

  // Pattern: XXX-XXXX-YYYYMMDD-XX
  // Example: CAR-RENTAL-20260206-01
  const parts = normalized.split('-')

  if (parts.length !== 4) {
    return null
  }

  const [category, type, dateStr, sequenceStr] = parts

  // Validate category (2-6 uppercase letters)
  if (!/^[A-Z]{2,6}$/.test(category)) {
    return null
  }

  // Validate type (2-10 uppercase letters)
  if (!/^[A-Z]{2,10}$/.test(type)) {
    return null
  }

  // Validate date (YYYYMMDD)
  if (!/^\d{8}$/.test(dateStr)) {
    return null
  }

  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6))
  const day = parseInt(dateStr.substring(6, 8))

  // Validate date is reasonable
  if (year < 2020 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  // Validate sequence (2 digits)
  if (!/^\d{2}$/.test(sequenceStr)) {
    return null
  }

  const sequence = parseInt(sequenceStr)

  return {
    category,
    type,
    date: dateStr,
    sequence,
    raw: normalized
  }
}

/**
 * Generate a QR code string from components
 * @param category - Vehicle category code (e.g., 'CAR', 'MTR')
 * @param type - Contract type code (e.g., 'RENTAL', 'PAWN')
 * @param date - Date string (YYYYMMDD) or Date object
 * @param sequence - Sequence number (1-99)
 * @returns Generated QR code string
 */
export function generateQRCodeString(
  category: string,
  type: string,
  date: string | Date,
  sequence: number
): string {
  // Normalize inputs
  const normalizedCategory = category.trim().toUpperCase()
  const normalizedType = type.trim().toUpperCase()

  // Format date
  let dateStr: string
  if (typeof date === 'string') {
    // Assume YYYY-MM-DD or YYYYMMDD format
    dateStr = date.replace(/-/g, '')
    if (dateStr.length !== 8) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD or YYYYMMDD')
    }
  } else {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    dateStr = `${year}${month}${day}`
  }

  // Validate sequence
  if (sequence < 1 || sequence > 99) {
    throw new Error('Sequence must be between 1 and 99')
  }

  const sequenceStr = String(sequence).padStart(2, '0')

  return `${normalizedCategory}-${normalizedType}-${dateStr}-${sequenceStr}`
}

/**
 * Get today's date string in YYYYMMDD format
 * @returns Date string for today
 */
export function getTodayDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}${month}${day}`
}

/**
 * Extract date from QR code and return as Date object
 * @param qrCode - QR code string
 * @returns Date object or null if invalid
 */
export function getDateFromQRCode(qrCode: string | null | undefined): Date | null {
  const parsed = parseQRCode(qrCode)

  if (!parsed) {
    return null
  }

  const year = parseInt(parsed.date.substring(0, 4))
  const month = parseInt(parsed.date.substring(4, 6)) - 1
  const day = parseInt(parsed.date.substring(6, 8))

  return new Date(year, month, day)
}

/**
 * Get display label for vehicle category
 * @param category - Category code
 * @returns Human readable category name
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'CAR': 'O to',
    'MTR': 'Xe may',
    'TRK': 'Xe tai',
    'VAN': 'Xe van',
    'BIK': 'Xe dap/Xe dien',
    'SPE': 'Phuong tien dac biet'
  }

  return labels[category.toUpperCase()] || category
}

/**
 * Get display label for contract type
 * @param type - Type code
 * @returns Human readable type name
 */
export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'PAWN': 'Cam do',
    'RENTAL': 'Cho thue/Cam xe',
    'SALE': 'Mua ban co dieu kien',
    'LEASE': 'Thue dai han',
    'CONSIGN': 'Ky gui ban'
  }

  return labels[type.toUpperCase()] || type
}

/**
 * Format QR code for display (add visual separation)
 * @param qrCode - QR code string
 * @returns Formatted QR code for display
 */
export function formatQRCodeForDisplay(qrCode: string | null | undefined): string {
  if (!qrCode) {
    return '-'
  }

  const parsed = parseQRCode(qrCode)

  if (!parsed) {
    return qrCode
  }

  // Format: CAR-RENTAL-20260206-01 -> CAR-RENTAL-2026.02.06-01
  const year = parsed.date.substring(0, 4)
  const month = parsed.date.substring(4, 6)
  const day = parsed.date.substring(6, 8)

  return `${parsed.category}-${parsed.type}-${year}.${month}.${day}-${String(parsed.sequence).padStart(2, '0')}`
}

/**
 * Validate if a string is a valid QR code format
 * @param qrCode - String to validate
 * @returns boolean indicating if valid
 */
export function isValidQRCode(qrCode: string | null | undefined): boolean {
  return parseQRCode(qrCode) !== null
}

/**
 * Compare two QR codes for sorting
 * @param a - First QR code
 * @param b - Second QR code
 * @returns Comparison result (-1, 0, 1)
 */
export function compareQRCodes(a: string, b: string): number {
  const parsedA = parseQRCode(a)
  const parsedB = parseQRCode(b)

  if (!parsedA && !parsedB) return a.localeCompare(b)
  if (!parsedA) return 1
  if (!parsedB) return -1

  // Compare by date first
  if (parsedA.date !== parsedB.date) {
    return parsedA.date.localeCompare(parsedB.date)
  }

  // Then by category
  if (parsedA.category !== parsedB.category) {
    return parsedA.category.localeCompare(parsedB.category)
  }

  // Then by type
  if (parsedA.type !== parsedB.type) {
    return parsedA.type.localeCompare(parsedB.type)
  }

  // Finally by sequence
  return parsedA.sequence - parsedB.sequence
}

/**
 * Generate QR code data URL for printing
 * This creates a simple text-based representation for debugging/testing
 * In production, use qrcode.react library for actual QR codes
 * @param qrCode - QR code string
 * @returns Data URL or null
 */
export function generateQRDataForPrinting(qrCode: string): string {
  // This is a placeholder - actual QR generation is done via qrcode.react
  // Returns the QR code text that will be encoded
  return qrCode
}

/**
 * Extract metadata from QR code for display
 * @param qrCode - QR code string
 * @returns Object with display metadata
 */
export function getQRCodeMetadata(qrCode: string | null | undefined): {
  isValid: boolean
  categoryLabel: string
  typeLabel: string
  formattedDate: string
  displayString: string
} | null {
  if (!qrCode) {
    return null
  }

  const parsed = parseQRCode(qrCode)

  if (!parsed) {
    return {
      isValid: false,
      categoryLabel: '-',
      typeLabel: '-',
      formattedDate: '-',
      displayString: qrCode
    }
  }

  const year = parsed.date.substring(0, 4)
  const month = parsed.date.substring(4, 6)
  const day = parsed.date.substring(6, 8)

  return {
    isValid: true,
    categoryLabel: getCategoryLabel(parsed.category),
    typeLabel: getTypeLabel(parsed.type),
    formattedDate: `${day}/${month}/${year}`,
    displayString: formatQRCodeForDisplay(qrCode)
  }
}
