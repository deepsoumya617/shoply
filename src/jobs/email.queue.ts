// producer
import { emailQueue } from '../config/queue'

const DEFAULT_JOB_OPTIONS = {
  attempts: 3, // retry
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
}

export async function enqueueVerificationEmail(payload: {
  email: string
  token: string
}) {
  await emailQueue.add('send-verification-email', payload, DEFAULT_JOB_OPTIONS)
}
