import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import redis from './config/redis'
import { RedisStore } from 'connect-redis'
import { env } from './config/env'
import authRoutes from './modules/auth/auth.routes'
import productRoutes from './modules/product/product.routes'
import userRoutes from './modules/user/user.routes'
import cartRoutes from './modules/cart/cart.routes'

const app: Express = express()

// redis store setup
const redisStore = new RedisStore({
  client: redis,
  prefix: 'sess:',
})

app.use(
  session({
    store: redisStore,
    secret: env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
)

// middleware setup
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(cookieParser())

// routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/users', userRoutes)
app.use('/api/cart/items', cartRoutes)

export default app
