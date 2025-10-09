import { Router } from 'express'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { customerMiddleware } from '../../middlewares/customer.middleware'
import { createOrder } from './order.controllers'

const orderRouter = Router()

// only authenticated CUSTOMERS can place orders
orderRouter.use(authMiddleware, customerMiddleware)

// create order
orderRouter.post('/create', createOrder)

export default orderRouter
