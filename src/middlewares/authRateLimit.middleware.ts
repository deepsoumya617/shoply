import rateLimit from 'express-rate-limit'
import RedisStore, { RedisReply } from 'rate-limit-redis'
import redis from '../config/redis'

export const registerLimiter = rateLimit({
  // setup the redis store
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redis.call(command, ...args) as Promise<RedisReply>,
  }),

  // config
  windowMs: 15 * 1000, // 1 minute
  limit: 10,
  message: 'Too many registration attempts. Please wait a minute.',
  standardHeaders: true,
  legacyHeaders: false,
})
