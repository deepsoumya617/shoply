import { Router } from 'express'
import {
  createProduct,
  getAllProducts,
  getProductById,
} from './product.controllers'
import { adminOrSellerMiddleware } from '../../middlewares/adminOrSeller.middleware'
import { authMiddleware } from '../../middlewares/auth.middleware'

const productRouter = Router()

// product routes

// public route - no auth needed
productRouter.get('/', getAllProducts)
productRouter.get('/:id', getProductById)

// protected routes
productRouter.post('/', authMiddleware, adminOrSellerMiddleware, createProduct)

export default productRouter
