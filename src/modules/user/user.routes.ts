import { Router } from 'express'
import { adminMiddleware } from '../../middlewares/adminMiddleware'
import { getAllUsers } from './user.controllers'
import { authMiddleware } from '../../middlewares/auth.middleware'

const userRouter = Router()

// middleware
userRouter.use(authMiddleware)

// routes - user only

// routes - admin only
userRouter.get('/', adminMiddleware, getAllUsers)

export default userRouter
