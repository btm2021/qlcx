/**
 * Validation utilities for Vietnamese data formats
 * Phone numbers, ID cards, emails, etc.
 */

/**
 * Validate Vietnamese phone number
 * Supports: 10-digit mobile numbers starting with 03, 05, 07, 08, 09
 * @param phone - Phone number to validate
 * @returns boolean indicating if phone is valid
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) {
    return false
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // Vietnamese mobile numbers: 10 digits starting with 03, 05, 07, 08, 09
  const mobileRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/

  // Landline numbers (optional support)
  // const landlineRegex = /^(0[2|4|6|8])+([0-9]{8,9})$/

  return mobileRegex.test(cleaned)
}

/**
 * Validate ID card number (CMND/CCCD)
 * CMND: 9 digits
 * CCCD: 12 digits
 * @param idCard - ID card number to validate
 * @returns boolean indicating if ID card is valid
 */
export function isValidIdCard(idCard: string | null | undefined): boolean {
  if (!idCard) {
    return false
  }

  // Remove all non-digit characters
  const cleaned = idCard.replace(/\D/g, '')

  // CMND: 9 digits, CCCD: 12 digits
  return /^\d{9}$/.test(cleaned) || /^\d{12}$/.test(cleaned)
}

/**
 * Validate email address
 * @param email - Email to validate
 * @returns boolean indicating if email is valid
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false
  }

  // Standard email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  return emailRegex.test(email)
}

/**
 * Validate license plate number (Vietnamese format)
 * Supports various formats: 51A-123.45, 51A1-123.45, etc.
 * @param plate - License plate to validate
 * @returns boolean indicating if plate is valid
 */
export function isValidLicensePlate(plate: string | null | undefined): boolean {
  if (!plate) {
    return false
  }

  // Remove spaces and normalize
  const cleaned = plate.trim().toUpperCase()

  // Vietnamese license plate patterns
  // Standard: 51A-123.45, 51A1-123.45
  // Electric: 51-MD1 123.45
  // Diplomatic: 80-NG-01-01
  const patterns = [
    /^\d{2}[A-Z]-\d{3}\.\d{2}$/,           // 51A-123.45
    /^\d{2}[A-Z]\d-\d{3}\.\d{2}$/,         // 51A1-123.45
    /^\d{2}-[A-Z]{2}\d?\s?\d{3}\.\d{2}$/,  // 51-MD1 123.45 (electric)
    /^\d{2}-NG-\d{2}-\d{2}$/,              // 80-NG-01-01 (diplomatic)
    /^\d{2}-NN-\d{2}-\d{2}$/,              // 80-NN-01-01 (foreign affairs)
  ]

  return patterns.some(pattern => pattern.test(cleaned))
}

/**
 * Validate QR code format
 * Format: {CATEGORY}-{TYPE}-{YYYYMMDD}-{SEQUENCE}
 * Example: CAR-RENTAL-20260206-01
 * @param qrCode - QR code to validate
 * @returns boolean indicating if QR code format is valid
 */
export function isValidQRCode(qrCode: string | null | undefined): boolean {
  if (!qrCode) {
    return false
  }

  // QR code pattern: XXX-XXXX-YYYYMMDD-XX
  const qrRegex = /^[A-Z]{2,6}-[A-Z]{2,10}-\d{8}-\d{2}$/

  return qrRegex.test(qrCode)
}

/**
 * Validate a date string in dd/MM/yyyy format
 * @param dateStr - Date string to validate
 * @returns boolean indicating if date is valid
 */
export function isValidDate(dateStr: string | null | undefined): boolean {
  if (!dateStr) {
    return false
  }

  // Check format dd/MM/yyyy
  const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/

  if (!dateRegex.test(dateStr)) {
    return false
  }

  // Validate actual date
  const [day, month, year] = dateStr.split('/').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getDate() === day &&
    date.getMonth() === month - 1 &&
    date.getFullYear() === year
  )
}

/**
 * Validate that a value is a positive number
 * @param value - Value to validate
 * @returns boolean indicating if value is a positive number
 */
export function isPositiveNumber(value: number | string | null | undefined): boolean {
  if (value === null || value === undefined || value === '') {
    return false
  }

  const num = typeof value === 'string' ? parseFloat(value) : value

  return !isNaN(num) && num > 0
}

/**
 * Validate that a string is not empty (after trimming)
 * @param value - String to validate
 * @returns boolean indicating if string is not empty
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0
}

/**
 * Validate minimum length of a string
 * @param value - String to validate
 * @param minLength - Minimum length required
 * @returns boolean indicating if string meets minimum length
 */
export function hasMinLength(value: string | null | undefined, minLength: number): boolean {
  if (!value) {
    return false
  }

  return value.trim().length >= minLength
}

/**
 * Validate maximum length of a string
 * @param value - String to validate
 * @param maxLength - Maximum length allowed
 * @returns boolean indicating if string is within maximum length
 */
export function hasMaxLength(value: string | null | undefined, maxLength: number): boolean {
  if (!value) {
    return true // Empty is considered within max length
  }

  return value.trim().length <= maxLength
}

/**
 * Validate Vietnamese name (allows Vietnamese characters)
 * @param name - Name to validate
 * @returns boolean indicating if name is valid
 */
export function isValidVietnameseName(name: string | null | undefined): boolean {
  if (!name) {
    return false
  }

  // Allow Vietnamese characters, spaces, and common name punctuation
  const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s'-]+$/

  return nameRegex.test(name.trim())
}

/**
 * Validate engine number or chassis number format
 * @param number - Number to validate
 * @returns boolean indicating if format is valid
 */
export function isValidEngineOrChassisNumber(number: string | null | undefined): boolean {
  if (!number) {
    return false
  }

  // Typically alphanumeric, 5-20 characters
  const cleaned = number.trim().toUpperCase()
  const numberRegex = /^[A-Z0-9]{5,20}$/

  return numberRegex.test(cleaned)
}

/**
 * Get validation error message for a field
 * @param fieldName - Name of the field
 * @param value - Value to validate
 * @param rules - Validation rules object
 * @returns Error message or null if valid
 */
export function getValidationError(
  fieldName: string,
  value: string | null | undefined,
  rules: {
    required?: boolean
    minLength?: number
    maxLength?: number
    isEmail?: boolean
    isPhone?: boolean
    isIdCard?: boolean
  }
): string | null {
  if (rules.required && !isNotEmpty(value)) {
    return `${fieldName} la bat buoc`
  }

  if (!value) {
    return null
  }

  if (rules.minLength && !hasMinLength(value, rules.minLength)) {
    return `${fieldName} phai co it nhat ${rules.minLength} ky tu`
  }

  if (rules.maxLength && !hasMaxLength(value, rules.maxLength)) {
    return `${fieldName} khong duoc qua ${rules.maxLength} ky tu`
  }

  if (rules.isEmail && !isValidEmail(value)) {
    return 'Email khong hop le'
  }

  if (rules.isPhone && !isValidPhone(value)) {
    return 'So dien thoai khong hop le'
  }

  if (rules.isIdCard && !isValidIdCard(value)) {
    return 'So CMND/CCCD khong hop le'
  }

  return null
}
