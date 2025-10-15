import { orderQueue } from '../config/queue'

// send mail on placing order
export async function enqueueCreateOrderJob(
  email: string,
  orderId: string,
  totalAmount: number
) {
  await orderQueue.add(
    'create-order',
    { email, orderId, totalAmount },
    { delay: 1000 * 12 }
  )
}

// payment confirmation
export async function enqueuePaymentJob(email: string, orderId: string) {
  await orderQueue.add('send-payment-confirmation', { email, orderId })
}

// shipment updates
export async function enqueueShipmentJob(email: string, orderId: string) {
  // shipped
  await orderQueue.add(
    'simulate-tracking-step',
    { email, orderId, step: 'PICKED_UP' },
    { delay: 1000 * 10 }
  )

  // in transit
  await orderQueue.add(
    'simulate-tracking-step',
    { email, orderId, step: 'IN_TRANSIT' },
    { delay: 1000 * 20 }
  )

  // out for delivery
  await orderQueue.add(
    'simulate-tracking-step',
    { email, orderId, step: 'OUT_FOR_DELIVERY' },
    { delay: 1000 * 40 }
  )

  // delivered
  await orderQueue.add(
    'simulate-tracking-step',
    { email, orderId, step: 'DELIVERED' },
    { delay: 1000 * 60 }
  )
}

// for keeping the system healthy
export async function enqueueOrderCleanupJob() {
  // job scheduler for repeatable jobs

  // cancel orders
  await orderQueue.upsertJobScheduler(
    'cancel-unpaid-orders-scheduler',
    { every: 10 * 1000 },
    {
      name: 'cancel-unpaid-orders',
    }
  )

  // delete cancelled orders
  await orderQueue.upsertJobScheduler(
    'remove-cancelled-orders-scheduler',
    { every: 15 * 1000 },
    {
      name: 'remove-cancelled-orders',
    }
  )
}
