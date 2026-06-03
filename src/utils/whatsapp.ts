/**
 * Validate that a phone number has exactly 10 digits (after removing non-digit chars and country code).
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  // Could be +91XXXXXXXXXX (12 digits) or just XXXXXXXXXX (10 digits)
  if (digits.length === 12 && digits.startsWith('91')) return true
  if (digits.length === 10) return true
  return false
}

/**
 * Build a WhatsApp deep link with pre-filled message.
 * Returns null if phone is invalid (not 10 digits).
 */
export function buildWhatsAppLink(
  phone: string,
  teacherName: string,
  profileUrl: string
): string | null {
  if (!isValidPhone(phone)) return null

  const message = `Namaste ${teacherName} Ji,

Maine TuitionMandi app pe aapka profile dekha.

Mujhe apne bachche ke liye tuition ki zaroorat hai. Kya aap available hain?

Profile: ${profileUrl}`

  const cleanPhone = phone.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

/**
 * Build a fee reminder WhatsApp link.
 * Returns null if phone is invalid.
 */
export function buildFeeReminderLink(
  phone: string,
  studentName: string,
  amountDue: number,
  month: string
): string | null {
  if (!isValidPhone(phone)) return null

  const message = `Namaste! \n\nYe message ${studentName} ki tuition fees ke liye hai. \n${month} mahine ki pending fees ₹${amountDue} hai. \n\nKripya samay par jama karein. Shukriya!`
  const cleanPhone = phone.replace(/\D/g, '')
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
