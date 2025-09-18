import { Router } from 'express'
import {
  createProduct,
  deleteProductById,
  getAllProducts,
  getProductByCategories,
  getProductById,
  updateProductById,
} from './product.controllers'
import { sellerMiddleware } from '../../middlewares/seller.middleware'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { adminOrSellerMiddleware } from '../../middlewares/adminOrSeller.middleware'

const productRouter = Router()

// product routes

// public route - no auth needed
productRouter.get('/', getAllProducts)
productRouter.get('/:id', getProductById)
productRouter.get('/category/:id', getProductByCategories)

// protected routes
productRouter.post('/', authMiddleware, sellerMiddleware, createProduct)
productRouter.put('/:id', authMiddleware, sellerMiddleware, updateProductById)
productRouter.delete(
  '/:id',
  authMiddleware,
  adminOrSellerMiddleware,
  deleteProductById
)
export default productRouter
