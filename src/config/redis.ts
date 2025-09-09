import { Redis } from 'ioredis'
import { env } from './env'

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
})

redis.on('connect', () => {
  console.log('Connected to Redis server!')
})

redis.on('error', err => {
  console.error('Redis connection error:', err)
})

export default redis
