import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { sendMail } from '../services/mail.service'
import { env } from '../config/env'

const emailWorker = new Worker(
  'email',
  async (job: Job) => {
    if (job.name === 'send-verification-email') {
      const verifyURL = `${env.APP_URL}/api/auth/verify-email?token=${encodeURIComponent(job.data.token)}`
      const html = `
        <p>Hi,</p>
        <p>Click to verify your email:</p>
        <p><a href="${verifyURL}">Verify email</a></p>
        <p>If you did not request this, please ignore.</p>
      `
      await sendMail({ to: job.data.email, subject: 'Verify your email', html })

      return { status: 'success' }
    }

    if (job.name === 'send-login-email') {
      const html = `
        <p>Hi ${job.data.email},</p>
        <p>Your login was successful. Use the token below to access your account:</p>
        <p><strong>${job.data.token}</strong></p>
        <p>If you did not request this, please secure your account immediately.</p>
      `

      await sendMail({ to: job.data.email, subject: 'Login Successful!', html })

      return { status: 'success' }
    }

    // unknown job
    throw new Error(`Unknown job name: ${job.name}`)
  },
  {
    connection: redis,
    concurrency: 5,
    stalledInterval: 30000,
    maxStalledCount: 3,
  }
)

emailWorker.on('completed', job => {
  console.log(`Job with ID ${job.id} has been completed`)
})

emailWorker.on('failed', (job, err) => {
  console.error(`Job with ID ${job?.id} has failed with error: ${err.message}`)
})

// shutdown worker gracefully
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...')
  await emailWorker.close()
  process.exit(0)
})
