import { Job, Worker } from 'bullmq'
import redis from '../config/redis'
import { db } from '../config/db'
import { orderItems } from '../db/schema'
import { eq } from 'drizzle-orm'
import { sendMail } from '../services/mail.service'

export function startOrderWorker() {
  const orderWorker = new Worker(
    'order',
    async (job: Job) => {
      const { orderId, email, totalAmount } = job.data

      // first fetch the ordered items
      const items = await db
        .select({
          productName: orderItems.productName,
          productPrice: orderItems.productPrice,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))

      // create order email job
      if (job.name === 'create-order') {
        const html = `
          <h2>Thanks for your order!</h2>
          <h3>Your order is created. Please complete the payment process to confirm the order. 
              Otherwise the order will be cancelled within 10 minutes.
          </h3>
          <p>Here’s what you ordered:</p>
          <ul>
            ${items.map(i => `<li>${i.productName} — ₹${i.productPrice} × ${i.quantity} = ₹${i.productPrice * i.quantity}</li>`).join('')}
          </ul>
          <p>Total Amount = ${totalAmount}</p>
          <h3>We’ve received your order. Please complete <a href="http://localhost:3000/api/orders/${orderId}/pay">payment.</a></h3>
        `

        await sendMail({
          to: email,
          subject: 'Order placed. Please complete payment.',
          html,
        })

        return { status: 'success' }
      }
    },
    {
      connection: redis,
      concurrency: 5,
      stalledInterval: 30000,
      maxStalledCount: 3,
    }
  )

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
}
