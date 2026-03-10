/**
 * Build a WhatsApp deep link with pre-filled message
 */
export function buildWhatsAppLink(
    phone: string,
    teacherName: string,
    profileUrl: string
): string {
    const message = `Namaste ${teacherName} Ji,

Maine Takhti app pe aapka profile dekha.

Mujhe apne bachche ke liye tuition ki zaroorat hai. Kya aap available hain?

Profile: ${profileUrl}`

    const cleanPhone = phone.replace(/\D/g, '')
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
