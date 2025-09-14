import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function generateToken(
  payload: object,
  tokenType: 'register' | 'login' | 'reset-password'
): string {
  return jwt.sign(payload, env.JWT_SECRET_KEY!, {
    expiresIn:
      tokenType === 'register' || tokenType === 'reset-password' ? '10m' : '4d',
  })
}

export function verifyToken<T>(token: string): T {
  return jwt.verify(token, env.JWT_SECRET_KEY!) as T
}
