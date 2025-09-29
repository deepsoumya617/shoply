import { Redis } from 'ioredis'
import { env } from './env'

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  // for running tests locally
  // host: 'localhost',
  // port: 6379,
  // db: 1,
  maxRetriesPerRequest: null,
})

redis.on('connect', () => {
  console.log('Connected to Redis server!')
})

redis.on('error', err => {
  console.error('Redis connection error:', err)
})

export default redis
