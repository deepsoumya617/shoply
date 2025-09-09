import app from './app'
import { connectDB } from './config/db'
import { env } from './config/env'
import redis from './config/redis'

// (async () => {
//   await redis.set('hello', 'world')
//   const val = await redis.get('hello')
//   console.log('Redis test value:', val)
// })()

async function startServer() {
  await redis.ping() // check redis connection
  await connectDB() // connect db

  app.listen(env.PORT, () => {
    console.log(`Server is running on port http://localhost:${env.PORT}`)
  })
}feat(server): add express, cors, and helmet middleware; configure database connection


startServer()
