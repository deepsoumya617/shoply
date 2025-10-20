import { Router } from 'express'
import { adminMiddleware } from '../../middlewares/admin.middleware'
import {
  getAllUsers,
  getMyProfile,
  requestUpdateRole,
  updateProfile,
  updateUserRole,
} from './user.controllers'
import { authMiddleware } from '../../middlewares/auth.middleware'
import { userLimiter } from '../../middlewares/ratelimit.middleware'

const userRouter = Router()

userRouter.use(userLimiter)

// middleware
userRouter.use(authMiddleware)

// routes - for all users
userRouter.get('/profile/me', getMyProfile)
userRouter.put('/profile/update/me', updateProfile)
userRouter.get('/profile/update/update-role', requestUpdateRole)

// routes - admin only
userRouter.get('/', adminMiddleware, getAllUsers)
userRouter.get('/admin/update-user-role', adminMiddleware, updateUserRole)

export default userRouter
