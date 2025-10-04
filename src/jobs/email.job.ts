// producer
import { emailQueue } from '../config/queue'

export async function enqueueVerificationEmail(payload: {
  email: string
  token: string
}) {
  await emailQueue.add('send-verification-email', payload)
}

export async function enqueueLoginEmail(payload: {
  email: string
  ip: string
  deviceInfo: string
}) {
  await emailQueue.add('send-login-email', payload)
}

export async function enqueueForgotPasswordEmail(payload: {
  email: string
  token: string
}) {
  await emailQueue.add('send-forgotPassword-email', payload)
}

export async function enqueueUpdateUserRoleEmail(payload: { userId: string }) {
  await emailQueue.add('send-updateUserRole-email', payload)
}
