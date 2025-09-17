import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import authRoutes from './modules/auth/auth.routes'
import productRoutes from './modules/product/product.routes'
import userRoutes from './modules/user/user.routes'
import { authMiddleware } from './middlewares/auth.middleware'

const app: Express = express()

// middleware setup
app.use(cors())
app.use(helmet())
app.use(express.json())

// routes
app.use('/api/auth', authRoutes)
app.use('/api/products', authMiddleware, productRoutes)
app.use('/api/users', authMiddleware, userRoutes)

export default app
