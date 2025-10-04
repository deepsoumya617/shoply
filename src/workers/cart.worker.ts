import { Job, Worker } from 'bullmq'
import { db } from '../config/db'
import { cartItems, carts, products } from '../db/schema'
import { eq } from 'drizzle-orm'
import { MS } from '../jobs/cart.job'
import { sendMail } from '../services/mail.service'
import redis from '../config/redis'

const cartWorker = new Worker(
  'cart',
  async (job: Job) => {
    const { cartId, email } = job.data

    // fetch the cart and cart items first
    const [cart] = await db.select().from(carts).where(eq(carts.id, cartId))

    if (!cart) {
      throw new Error(`Cart with ${cartId} not found!`)
    }

    const items = await db
      .select({
        name: products.name,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cartId))

    const lastActivity: Date = cart.lastActivity
    const diffMs = Date.now() - lastActivity.getTime()

    if (job.name === 'reminder1') {
      if (diffMs >= MS.day) {
        const html = `
            <h2>You left items in your cart</h2>
            <p>Here’s what you left:</p>
            <ul>
                ${items.map(i => `<li>${i.name} (x${i.quantity})</li>`).join('')}
            </ul>
            <p><a href="http://localhost:3000/api/cart/items">Return to your cart</a></p>
        `
        await sendMail({
          to: email,
          subject: 'You left items in your cart!',
          html,
        })

        return { status: 'success' }
      }
    }

    if (job.name === 'reminder2') {
      if (diffMs >= 3 * MS.day) {
        const html = `
            <h2>You left items in your cart</h2>
            <p>Here’s what you left:</p>
            <ul>
                ${items.map(i => `<li>${i.name} (x${i.quantity})</li>`).join('')}
            </ul>
            <p><a href="http://localhost:3000/api/cart/items">Return to your cart</a></p>
        `
        await sendMail({
          to: email,
          subject: 'You left items in your cart!',
          html,
        })

        return { status: 'success' }
      }
    }

    if (job.name === 'delete') {
      if (diffMs >= 7 * MS.day) {
        // delete cart items
        await db.delete(cartItems).where(eq(cartItems.cartId, cartId))

        const html = `
            <h2>Your abandoned cart items has been deleted!</h2>
            <p><a href="http://localhost:3000/api/cart/items">Return to your cart</a></p>
        `
        await sendMail({
          to: email,
          subject: 'You left items in your cart!',
          html,
        })

        return { status: 'success' }
      }
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

cartWorker.on('completed', job => {
  console.log(`Job with ID ${job.id} ${job.name} has been completed`)
})

cartWorker.on('failed', (job, err) => {
  console.error(
    `Job with ID ${job?.id} ${job?.name} has failed with error: ${err.message}`
  )
})

// shutdown worker gracefully
process.on('SIGTERM', async () => {
  console.log('Shutting down worker...')
  await cartWorker.close()
  process.exit(0)
})
