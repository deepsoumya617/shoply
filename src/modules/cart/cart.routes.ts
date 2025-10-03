import { Router } from 'express'
import { addItems } from './cart.controllers'
import { authMiddleware } from '../../middlewares/auth.middleware'

const cartRouter = Router()

// cart routes
cartRouter.post('/add-to-cart', authMiddleware, addItems)

export default cartRouter
