import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth.middleware'

export async function adminOrSellerMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // verify is user exists
  if (!req.user) {
    return res.status(403).json({ message: 'Unathorized.' })
  }

  // check user role
  if (req.user.role !== 'ADMIN' && req.user.role !== 'SELLER') {
    return res
      .status(403)
      .json({ message: 'Only ADMIN or SELLER can perform this action.' })
  }

  next()
}
