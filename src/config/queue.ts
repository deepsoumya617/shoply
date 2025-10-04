import { Queue } from 'bullmq'
import redis from './redis'

const DEFAULT_JOB_OPTIONS = {
  attempts: 3, // retry
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: true,
  removeOnFail: false,
}

// email queue
export const emailQueue = new Queue('email', {
  connection: redis,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
})

// cart queue
export const cartQueue = new Queue('cart', {
  connection: redis,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
})
