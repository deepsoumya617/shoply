import { Router } from 'express'
import { createProduct } from './product.controllers'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { adminOrSellerMiddleware } from '../../middlewares/adminOrSeller.middleware'

const productRouter = Router()

// product routes
productRouter.post(
  '/create-product',
  authMiddleware,
  adminOrSellerMiddleware,
  createProduct
)

export default productRouter
