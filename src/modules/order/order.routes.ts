import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { customerMiddleware } from '../../middlewares/customer.middleware'
import {
  createOrder,
  getAllOrders,
  getOrderByID,
  payForOrder,
  trackOrder,
} from './order.controllers'
import { orderLimiter } from '../../middlewares/ratelimit.middleware'

const orderRouter = Router()

orderRouter.use(orderLimiter)

// only authenticated CUSTOMERS can place orders
orderRouter.use(authMiddleware, customerMiddleware)

// create order
orderRouter.post('/create', createOrder)
orderRouter.get('/', getAllOrders)
orderRouter.get('/:id', getOrderByID)
orderRouter.get('/pay/:id', payForOrder)
orderRouter.get('/track/:id', trackOrder)

export default orderRouter
