import { Router } from 'express'
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
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
productRouter.put(
  '/:id',
  authMiddleware,
  adminOrSellerMiddleware,
  updateProductById
)

export default productRouter
