import app from './app'
import { connectDB } from './config/db'
import { env } from './config/env'
import redis from './config/redis'
import { verifyTransporter } from './services/mail.service'

// (async () => {
//   await redis.set('hello', 'world')
//   const val = await redis.get('hello')
//   console.log('Redis test value:', val)
// })()

async function startServer() {
  await verifyTransporter() // verify mail transporter
  await redis.ping() // check redis connection
  await connectDB() // connect db

  app.listen(env.PORT, () => {
    console.log(`Server is running on port http://localhost:${env.PORT}`)
  })
}

startServer()
