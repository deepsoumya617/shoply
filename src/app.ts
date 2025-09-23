import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import authRoutes from './modules/auth/auth.routes'
import productRoutes from './modules/product/product.routes'
import userRoutes from './modules/user/user.routes'

const app: Express = express()

// middleware setup
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(cookieParser())

// routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/users', userRoutes)

export default app
