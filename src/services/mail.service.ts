import nodemailer from 'nodemailer'
import { env } from '../config/env'

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
})

// verify transporter
export async function verifyTransporter() {
  await transporter.verify()
  console.log('Transporter verified successfully!')
}

// send mail
export async function sendMail(options: {
  to: string
  subject: string
  html?: string
  text?: string
  from?: string
}) {
  const mailOptions = {
    from: options.from ?? env.EMAIL_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`Email queued to Mailtrap ID ${info.messageId}`)
  } catch (error) {
    console.error('Error sending email:', error)
  }
}
