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
export const authQueue = new Queue('auth', {
  connection: redis,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
})

// cart queue
export const cartQueue = new Queue('cart', {
  connection: redis,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
})

// order queue
export const orderQueue = new Queue('order', {
  connection: redis,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
})
