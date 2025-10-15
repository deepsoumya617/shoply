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
  // cancel orders if not paid within 10 mins of creation
  await orderQueue.add(
    'cancel-unpaid-orders',
    {},
    {
      repeat: { every: 10 * 60 * 1000 },
    }
  )

  // cleanup cancelled orders from db
  await orderQueue.add(
    'remove-cancelled-orders',
    {},
    {
      repeat: { every: 6 * 60 * 60 * 1000 },
    }
  )
}
