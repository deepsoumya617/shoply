import { beforeAll, beforeEach, afterAll } from 'vitest'
import { connectDB, db } from '../config/db'
import redis from '../config/redis'

beforeAll(async () => {
  await connectDB()
  await redis.ping()
  console.log('Test db and redis are connected')
})

beforeEach(async () => {
  await db.execute(
    `TRUNCATE TABLE users, products, refresh_tokens RESTART IDENTITY CASCADE;`
  )
  await redis.flushdb()
})

afterAll(async () => {
  await redis.quit()
  console.log('Redis connection closed')
})
