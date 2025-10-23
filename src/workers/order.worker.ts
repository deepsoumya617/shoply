import { Job, Worker } from 'bullmq'
import redis from '../config/redis'
import { db } from '../config/db'
import { orderItems, orders } from '../db/schema'
import { and, eq, lt } from 'drizzle-orm'
import { sendMail } from '../services/mail.service'

export function startOrderWorker() {
  const orderWorker = new Worker(
    'order',
    async (job: Job) => {
      // create order email job
      if (job.name === 'create-order') {
        const { email, orderId, totalAmount } = job.data

        // first fetch the ordered items
        const items = await db
          .select({
            productName: orderItems.productName,
            productPrice: orderItems.productPrice,
            quantity: orderItems.quantity,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId))

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
          <h3>We’ve received your order. Please complete <a href="http://localhost:3000/api/orders/pay/${orderId}">payment.</a></h3>
        `

        await sendMail({
          to: email,
          subject: 'Order placed. Please complete payment.',
          html,
        })

        return { status: 'success' }
      }

      // payment done
      if (job.name === 'send-payment-confirmation') {
        const { email, orderId } = job.data
        const html = `
          <h2>Thank you for the payment.</h2>
          <p>Order ID: ${orderId}</p>
          <p>Your order is confirmed and we are preparing your order.</p>
        `

        await sendMail({ to: email, subject: 'Payment successfull', html })

        return { status: 'success' }
      }

      // shipment updates
      if (job.name === 'simulate-tracking-step') {
        const status = {
          PICKED_UP: 'Picked Up',
          IN_TRANSIT: 'In Transit',
          OUT_FOR_DELIVERY: 'Out for delivery',
          DELIVERED: 'Delivered',
        }

        const { email, orderId, step } = job.data as {
          email: string
          orderId: string
          step: keyof typeof status
        }

        const html = `
          <h2>Shipment Update</h2>
          <p>Order ID: ${orderId}</p>
          <p>Status: ${status[step] || 'Unknown'}</p>
        `

        await sendMail({ to: email, subject: 'Order update', html })

        return { status: 'success' }
      }

      // cancel unpaid jobs
      if (job.name === 'cancel-unpaid-orders') {
        const now = new Date()
        const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000)

        // cancel jobs
        await db
          .update(orders)
          .set({
            orderStatus: 'CANCELLED',
          })
          .where(
            and(
              eq(orders.orderStatus, 'AWAITING_PAYMENT'),
              lt(orders.createdAt, tenMinsAgo)
            )
          )

        return { status: 'success' }
      }

      // delete cancelled jobs in every 6 hours
      if (job.name === 'remove-cancelled-orders') {
        await db.delete(orders).where(eq(orders.orderStatus, 'CANCELLED'))

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

  orderWorker.on('completed', job => {
    console.log(`Job with ID ${job.id} ${job.name} has been completed`)
  })

  orderWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} ${job?.name} failed:`)
    console.error(err)
  })

  // shutdown worker gracefully
  process.on('SIGTERM', async () => {
    console.log('Shutting down worker...')
    await orderWorker.close()
    process.exit(0)
  })
}
