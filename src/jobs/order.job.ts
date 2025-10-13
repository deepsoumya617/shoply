import { orderQueue } from '../config/queue'

// send mail on placing order
export async function enqueueCreateOrderJob(
  email: string,
  orderId: string,
  totalAmount: number
) {
  await orderQueue.add('create-order', { orderId, email, totalAmount })
}
