import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth.middleware'

export async function adminMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // verify is user exists
  if (!req.user) {
    return res.status(403).json({ message: 'Unathorized.' })
  }

  // check user role
  if (req.user.role !== 'ADMIN') {
    return res
      .status(403)
      .json({ message: 'Only ADMIN can perform this action.' })
  }

  next()
}
