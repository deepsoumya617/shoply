import rateLimit from 'express-rate-limit'
import RedisStore, { RedisReply } from 'rate-limit-redis'
import redis from '../config/redis'

function createLimiter({
  windowMs,
  limit,
  message,
}: {
  windowMs: number
  limit: number
  message: string
}) {
  return rateLimit({
    // setup the redis store
    store: new RedisStore({
      sendCommand: (command: string, ...args: string[]) =>
        redis.call(command, ...args) as Promise<RedisReply>,
    }),

    // config
    windowMs,
    limit,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  })
}

export const authLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  message: 'Too many authentication requests. Please wait a minute.',
})

export const userLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  message: 'Too many user-related requests. Please wait a moment.',
})

export const productLimiter = createLimiter({
  windowMs: 15 * 1000,
  limit: 50,
  message: 'Too many product requests. Please slow down.',
})

export const cartLimiter = createLimiter({
  windowMs: 30 * 1000,
  limit: 20,
  message: 'Too many cart updates. Try again soon.',
})

export const orderLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  message: 'Too many order actions. Please wait a minute.',
})

export const uploadLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 3,
  message: 'Too many uploads. Try again later.',
})
