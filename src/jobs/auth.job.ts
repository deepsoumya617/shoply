// producer
import { authQueue } from '../config/queue'

export async function enqueueVerificationEmail(payload: {
  email: string
  token: string
}) {
  await authQueue.add('send-verification-email', payload)
}

export async function enqueueLoginEmail(payload: {
  email: string
  ip: string
  deviceInfo: string
}) {
  await authQueue.add('send-login-email', payload)
}

export async function enqueueForgotPasswordEmail(payload: {
  email: string
  token: string
}) {
  await authQueue.add('send-forgotPassword-email', payload)
}

export async function enqueueUpdateUserRoleEmail(payload: { userId: string }) {
  await authQueue.add('send-updateUserRole-email', payload)
}
