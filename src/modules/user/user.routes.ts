import { Router } from 'express'
import { adminMiddleware } from '../../middlewares/adminMiddleware'
import { getAllUsers } from './user.controllers'

const userRouter = Router()

// routes - user only

// routes - admin only
userRouter.get('/', adminMiddleware, getAllUsers)

export default userRouter
