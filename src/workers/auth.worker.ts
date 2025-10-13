import { Worker, Job } from 'bullmq'
import redis from '../config/redis'
import { sendMail } from '../services/mail.service'
import { env } from '../config/env'

export function startAuthWorker() {
  const emailWorker = new Worker(
    'auth',
    async (job: Job) => {
      if (job.name === 'send-verification-email') {
        const verifyURL = `${env.APP_URL}/api/auth/verify-email?token=${encodeURIComponent(job.data.token)}`
        const html = `
        <p>Hi,</p>
        <p>Click to verify your email:</p>
        <p><a href="${verifyURL}">Verify email</a></p>
        <p>If you did not request this, please ignore.</p>
      `
        await sendMail({
          to: job.data.email,
          subject: 'Verify your email',
          html,
        })

        return { status: 'success' }
      }

      if (job.name === 'send-login-email') {
        const html = `
        <p>Hi ${job.data.email},</p>
        <p>A new login to your account was just detected:</p>
        <ul>
          <li><strong>Device:</strong> ${job.data.deviceInfo}</li>
          <li><strong>IP:</strong> ${job.data.ip}</li>
          <li><strong>Time:</strong> ${new Date().toUTCString()}</li>
        </ul>
        <p>If this wasn’t you, please <a href="http://localhost:8080/api/auth/reset-password">reset your password</a> immediately.</p>
      `

        await sendMail({
          to: job.data.email,
          subject: 'Login Successful!',
          html,
        })

        return { status: 'success' }
      }

      if (job.name === 'send-forgotPassword-email') {
        const resetPasswordURL = `${env.APP_URL}/api/auth/reset-password?token=${encodeURIComponent(job.data.token)}`

        const html = `
        <p>Hi,</p>
        <p>Click here to reset your password:</p>
        <p><a href="${resetPasswordURL}">Verify email</a></p>
        <p>If you did not request this, please ignore.</p>
      `

        await sendMail({ to: job.data.email, subject: 'Reset Password', html })

        return { status: 'success' }
      }

      if (job.name === 'send-updateUserRole-email') {
        const updateRoleURL = `${env.APP_URL}/api/users/admin/update-user-role?userId=${job.data.userId}`

        const html = `
        <p>Hi,</p>
        <p>Click here to change ROLE of the user with id "${job.data.userId}":</p>
        <p><a href="${updateRoleURL}">Update user role</a></p>
      `

        await sendMail({
          to: env.ADMIN_EMAIL,
          subject: 'Update user role',
          html,
        })

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
    console.error(
      `Job with ID ${job?.id} has failed with error: ${err.message}`
    )
  })

  // shutdown worker gracefully
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...')
    await emailWorker.close()
    process.exit(0)
  })
}
