import { startAuthWorker } from './auth.worker'
import { startCartWorker } from './cart.worker'
import { startOrderWorker } from './order.worker'

// start all workers
console.log('Starting all workers....')

startAuthWorker()
startCartWorker()
startOrderWorker()

console.log('All workers have started✅')
