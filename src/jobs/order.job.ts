import { orderQueue } from '../config/queue'

// send mail on placing order
export async function enqueueCreateOrderJob(orderId: string) {
  await orderQueue.add('create-order', { orderId })
}
