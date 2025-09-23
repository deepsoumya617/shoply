import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function generateToken(
  payload: object,
): string {
  return jwt.sign(payload, env.JWT_SECRET_KEY!, {
    expiresIn: '15m',
  })
}

export function verifyToken<T>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET_KEY!) as T
}
