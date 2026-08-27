import { fmtDate } from './formatters'

/**
 * Normalizes phone numbers to international format without plus or spaces.
 * Default to India (+91) if 10 digits provided.
 */
export function formatPhoneNumber(phone = '') {
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`
  return digits
}

/**
 * Prepares personalized WhatsApp message for a Committee Member assignment.
 */
export function getCommitteeInviteText(member, villageName = 'Vinayaka Vedika') {
  const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `🙏 *Namaste ${member.name} garu!*\n\nYou have been assigned as *${member.role}* for *${villageName} 2026*.\n\nThank you for leading the arrangements for this year's Vinayaka Chavithi celebration. Ganapathi Bappa Morya! 🪔\n\n🌐 *Festival Portal:* ${portalUrl}`
}

/**
 * Prepares personalized WhatsApp message for a Volunteer Duty assignment.
 */
export function getVolunteerDutyText(volunteer, villageName = 'Vinayaka Vedika') {
  const portalUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const dateStr = fmtDate(volunteer.date)
  return `🙏 *Namaste ${volunteer.name} garu!*\n\nYou have been assigned to volunteer duty for *${villageName} 2026*:\n\n📋 *Duty:* ${volunteer.duty}\n📅 *Date:* ${dateStr}\n\nThank you for your dedicated service to the community! 🪔\n\n🌐 *Festival Portal:* ${portalUrl}`
}

/**
 * Opens WhatsApp Web or WhatsApp App with the prefilled message.
 */
export function openWhatsAppMessage(phone, message) {
  const formattedNumber = formatPhoneNumber(phone)
  if (!formattedNumber) return false
  const url = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
  return true
}

/**
 * Optional server-side SMS/WhatsApp dispatch if SMS gateway API is configured.
 */
export async function sendServerNotification({ phone, name, role, duty, date, type, villageName }) {
  try {
    const formattedNumber = formatPhoneNumber(phone)
    if (!formattedNumber) return { success: false, error: 'Invalid phone number' }

    const response = await fetch('/api/notify-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: formattedNumber,
        name,
        role,
        duty,
        date,
        type,
        villageName
      })
    })

    if (!response.ok) {
      return { success: false, fallbackToWhatsApp: true }
    }
    return { success: true }
  } catch {
    return { success: false, fallbackToWhatsApp: true }
  }
}

