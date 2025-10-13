import { cartQueue } from '../config/queue'

export const MS = {
  hour: 3600_000,
  day: 24 * 3600_000,
}

export async function enqueueCartJobs(cartId: string, email: string) {
  // remove old jobs first
  const jobIds = [
    `reminder1:${cartId}`,
    `reminder2:${cartId}`,
    `delete:${cartId}`,
  ]

  for (const id of jobIds) {
    const job = await cartQueue.getJob(id)
    if (job) await job.remove()
  }

  // add new delayed jobs
  // 24h reminder
  await cartQueue.add(
    'reminder1', // job name
    { cartId, email }, // payload
    {
      jobId: `reminder1:${cartId}`, // unique id to avoid duplicates
      delay: 1 * MS.day,
      //   delay: 10 * 1000, // for testing
    }
  )

  // 72h
  await cartQueue.add(
    'reminder2',
    { cartId, email },
    {
      jobId: `reminder2:${cartId}`,
      delay: 3 * MS.day,
    }
  )

  // delete cart items
  await cartQueue.add(
    'delete',
    { cartId, email },
    {
      jobId: `delete:${cartId}`,
      delay: 7 * MS.day,
    }
  )
}
