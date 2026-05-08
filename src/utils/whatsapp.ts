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

export function buildFeeReminderLink(
    phone: string,
    studentName: string,
    amountDue: number,
    month: string
): string {
    const message = `Namaste! \n\nYe message ${studentName} ki tuition fees ke liye hai. \n${month} mahine ki pending fees Rs ${amountDue} hai. \n\nKripya samay par jama karein. Shukriya!`
    const cleanPhone = phone.replace(/\D/g, '')
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}
