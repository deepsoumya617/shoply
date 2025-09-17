import { Router } from 'express'
import { createProduct } from './product.controllers'
import { adminOrSellerMiddleware } from '../../middlewares/adminOrSeller.middleware'

const productRouter = Router()

// product routes
productRouter.post('/', adminOrSellerMiddleware, createProduct)

export default productRouter
