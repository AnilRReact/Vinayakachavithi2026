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
  return `🙏 *Namaste ${volunteer.name} garu!*\n\nYou have been assigned to volunteer seva duty for *${villageName} 2026*:\n\n📋 *Duty:* ${volunteer.duty}\n📅 *Date:* ${dateStr}\n\nThank you for your dedicated seva to the celebration! 🪔\n\n🌐 *Festival Portal:* ${portalUrl}`
}

/**
 * Opens WhatsApp Web or WhatsApp App with the prefilled message.
 * Supports sharing to specific phone number OR sharing to any contact/group/status.
 */
export function openWhatsAppMessage(phone = '', message = '') {
  const formattedNumber = formatPhoneNumber(phone)
  const encodedText = encodeURIComponent(message || '')

  let url = ''
  if (formattedNumber) {
    url = `https://api.whatsapp.com/send?phone=${formattedNumber}&text=${encodedText}`
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedText}`
  }

  if (typeof window !== 'undefined') {
    const win = window.open(url, '_blank', 'noopener,noreferrer')
    // Fallback if popup blocked
    if (!win) {
      window.location.href = url
    }
  }
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
