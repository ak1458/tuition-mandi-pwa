/**
 * Help & Support config + feedback submission.
 *
 * In production replace `sendSupportFeedback` to POST to a Supabase Edge
 * Function or external endpoint. Currently appends to localStorage and opens
 * WhatsApp/email so the user always has a way to reach support.
 */

export const SUPPORT_CONFIG = {
  whatsappNumber: '+919999999999', // Replace with real Takhti support number in production
  email: 'support@takhti.app',
  hours: 'Mon-Sat, 10 AM - 7 PM IST',
}

export interface SupportTicket {
  id: string
  user_id: string
  subject: string
  message: string
  contact: string
  contact_method: 'whatsapp' | 'email' | 'app'
  created_at: string
}

const STORAGE_KEY = 'takhti_support_tickets_v1'

function readAll(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SupportTicket[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items: SupportTicket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function recordSupportTicket(ticket: Omit<SupportTicket, 'id' | 'created_at'>): SupportTicket {
  const all = readAll()
  const next: SupportTicket = {
    ...ticket,
    id: `support-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  }
  all.unshift(next)
  writeAll(all.slice(0, 20))
  return next
}

export function listSupportTickets(userId: string): SupportTicket[] {
  return readAll().filter((entry) => entry.user_id === userId)
}

export function buildSupportWhatsAppLink(subject: string, message: string): string {
  const phone = SUPPORT_CONFIG.whatsappNumber.replace(/\D/g, '')
  const text = `Takhti Support — ${subject}\n\n${message}`
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export function buildSupportMailto(subject: string, message: string): string {
  return `mailto:${SUPPORT_CONFIG.email}?subject=${encodeURIComponent(`[Takhti] ${subject}`)}&body=${encodeURIComponent(message)}`
}
