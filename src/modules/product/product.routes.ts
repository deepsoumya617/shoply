import { Router } from 'express'
import {
  createProduct,
  deleteProductById,
  getAllCategories,
  getAllProducts,
  getProductByCategories,
  getProductById,
  updateProductById,
  uploadProductImage,
} from './product.controllers'
import { sellerMiddleware } from '../../middlewares/seller.middleware'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { adminOrSellerMiddleware } from '../../middlewares/adminOrSeller.middleware'
import { upload } from '../../config/multer'
import {
  productLimiter,
  uploadLimiter,
} from '../../middlewares/ratelimit.middleware'

const productRouter = Router()

productRouter.use(productLimiter)

// product routes

// public route - no auth needed
productRouter.get('/', getAllProducts)
productRouter.get('/categories', getAllCategories)
productRouter.get('/category/:id', getProductByCategories)
productRouter.get('/:id', getProductById)

// protected routes
productRouter.post('/', authMiddleware, sellerMiddleware, createProduct)
productRouter.put('/:id', authMiddleware, sellerMiddleware, updateProductById)
productRouter.delete(
  '/:id',
  authMiddleware,
  adminOrSellerMiddleware,
  deleteProductById
)
productRouter.post(
  '/:id/upload-image',
  uploadLimiter,
  authMiddleware,
  sellerMiddleware,
  upload.array('images', 3),
  uploadProductImage
)
export default productRouter
