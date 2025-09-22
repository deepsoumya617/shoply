import { Router } from 'express'
import { adminMiddleware } from '../../middlewares/admin.middleware'
import { getAllUsers, getMyProfile, updateProfile } from './user.controllers'
import { authMiddleware } from '../../middlewares/auth.middleware'

const userRouter = Router()

// middleware
userRouter.use(authMiddleware)

// routes - for all users
userRouter.get('/profile/me', authMiddleware, getMyProfile)
userRouter.put('/profile/update/me', authMiddleware, updateProfile)

// routes - admin only
userRouter.get('/', adminMiddleware, getAllUsers)

export default userRouter
