import { Router } from 'express'
import { addItems, getCartItems, updateQuantity } from './cart.controllers'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { customerMiddleware } from '../../middlewares/customer.middleware'

const cartRouter = Router()

// check if user is a customer or not using customerMiddlewar
cartRouter.use(authMiddleware, customerMiddleware)

// cart routes
cartRouter.post('/add-to-cart', addItems)
cartRouter.get('/', getCartItems)
cartRouter.put('/:id', updateQuantity)

export default cartRouter
