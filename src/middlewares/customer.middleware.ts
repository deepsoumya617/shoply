import { NextFunction, Response } from 'express'
import { AuthRequest } from './auth.middleware'

export async function customerMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // check user role
  if (req.user!.role !== 'CUSTOMER') {
    return res.status(403).json({
      message: 'only customers can use cart',
    })
  }

  next()
}
