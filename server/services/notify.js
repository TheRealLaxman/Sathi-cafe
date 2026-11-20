import { mailConfigured, sendMail } from '../utils/mailer.js'

const ownerEmail = () => process.env.OWNER_EMAIL || process.env.ADMIN_EMAIL || ''
const ownerWhatsapp = () => process.env.OWNER_WHATSAPP || '9779821401563'

// Build a WhatsApp link for a number and message.
export function whatsappLink(number, text = '') {
  const clean = String(number).replace(/\D/g, '')
  return `https://wa.me/${clean}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

// Send an email when SMTP is configured.
async function deliver(to, subject, text) {
  if (!mailConfigured() || !to) return false
  try {
    await sendMail({ to, subject, text })
    return true
  } catch (err) {
    console.error('Email delivery failed:', err.message)
    return false
  }
}

// Notify the owner by email with a WhatsApp link.
export async function notifyOwner(subject, text) {
  const link = whatsappLink(ownerWhatsapp(), `${subject}\n\n${text}`)
  const sent = await deliver(ownerEmail(), subject, `${text}\n\nOpen in WhatsApp: ${link}`)
  if (!sent) console.warn(`[notification] ${subject}: ${text}`)
  return sent
}

// Email the customer with the given message.
export async function notifyCustomer(to, subject, text) {
  return deliver(to, subject, text)
}
