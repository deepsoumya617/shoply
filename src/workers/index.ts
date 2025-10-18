import { startAuthWorker } from './auth.worker'
import { startCartWorker } from './cart.worker'
import { startImageWorker } from './image.worker'
import { startOrderWorker } from './order.worker'

// start all workers
console.log('Starting all workers....')

startAuthWorker()
startCartWorker()
startOrderWorker()
startImageWorker()

console.log('All workers have started✅')
