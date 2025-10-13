import { Job, Worker } from 'bullmq'
import redis from '../config/redis'

const orderWorker = new Worker('order', async (job: Job) => {}, {
  connection: redis,
  concurrency: 5,
  stalledInterval: 30000,
  maxStalledCount: 3,
})

orderWorker.on('completed', job => {
  console.log(`Job with ID ${job.id} ${job.name} has been completed`)
})

orderWorker.on('failed', (job, err) => {
  console.error(
    `Job with ID ${job?.id} ${job?.name} has failed with error: ${err.message}`
  )
})

// shutdown worker gracefully
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...')
  await orderWorker.close()
  process.exit(0)
})
