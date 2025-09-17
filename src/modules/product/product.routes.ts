import { Router } from 'express'
import { createProduct } from './product.controllers'
import { adminOrSellerMiddleware } from '../../middlewares/adminOrSeller.middleware'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { getAllProducts } from '../user/user.controllers'

const productRouter = Router()

// product routes
productRouter.post('/', authMiddleware, adminOrSellerMiddleware, createProduct)
productRouter.get('/', getAllProducts)

export default productRouter
