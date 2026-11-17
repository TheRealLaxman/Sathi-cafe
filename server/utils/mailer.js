import nodemailer from 'nodemailer'

export async function sendMail({ to, subject, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env

  if (!SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') {
      console.error('SMTP is not configured, so the email to', to, 'was not sent')
    } else {
      console.log(`\n--- email (SMTP not set up, printing here instead) ---\nTo: ${to}\n${subject}\n\n${text}\n`)
    }
    return
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  })

  await transporter.sendMail({ from: MAIL_FROM || SMTP_USER, to, subject, text })
}
