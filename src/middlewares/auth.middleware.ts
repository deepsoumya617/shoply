import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/jwt'
import { db } from '../config/db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

// extend Request to bind userId
export interface AuthRequest extends Request {
  user?: { userId: string; role: string }
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // extract the token from authorization header
  const token = req.headers.authorization?.split(' ')[1]

  // verify
  if (!token) {
    return res.status(401).json({
      message: 'Access denied. No token provided.',
    })
  }

  try {
    // decode token
    const decodedToken = verifyToken<{ userId: string }>(token)
    const { userId } = decodedToken

    // find user
    const [user] = await db.select().from(users).where(eq(users.id, userId))

    // no user
    if (!user) {
      return res.status(403).json({ message: 'User does not exist!' })
    }

    // user isn't verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'User is not verified!' })
    }

    // attach the userid to req
    req.user = {
      userId,
      role: user.role,
    }
    
    next()
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ message: 'Invalid token' })
  }
}
