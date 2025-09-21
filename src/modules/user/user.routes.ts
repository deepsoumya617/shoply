import { Router } from 'express'
import { adminMiddleware } from '../../middlewares/admin.middleware'
import { getAllUsers, getMyProfile } from './user.controllers'
import { authMiddleware } from '../../middlewares/auth.middleware'

const userRouter = Router()

// middleware
userRouter.use(authMiddleware)

// routes - for all users
userRouter.get('/profile/me', authMiddleware, getMyProfile)

// routes - admin only
userRouter.get('/', adminMiddleware, getAllUsers)

export default userRouter
