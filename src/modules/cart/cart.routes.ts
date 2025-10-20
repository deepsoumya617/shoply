import { Router } from 'express'
import {
  addItems,
  deleteItemById,
  getCartItems,
  updateQuantity,
} from './cart.controllers'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { customerMiddleware } from '../../middlewares/customer.middleware'
import { cartLimiter } from '../../middlewares/ratelimit.middleware'

const cartRouter = Router()
cartRouter.use(cartLimiter)

// check if user is a customer or not using customerMiddlewar
cartRouter.use(authMiddleware, customerMiddleware)

// cart routes
cartRouter.post('/add-to-cart', addItems)
cartRouter.get('/', getCartItems)
cartRouter.put('/:id', updateQuantity)
cartRouter.delete('/:id', deleteItemById)

export default cartRouter
