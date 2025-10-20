import { Router } from 'express'
import {
  forgotPassword,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  verifyEmail,
} from './auth.controllers'
import { authLimiter } from '../../middlewares/ratelimit.middleware'

const authRouter = Router()

authRouter.use(authLimiter)

// auth routes
authRouter.post('/register', registerUser)
authRouter.get('/verify-email', verifyEmail)
authRouter.post('/login', loginUser)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.get('/refresh', refreshAccessToken)
authRouter.get('/logout', logOutUser)

export default authRouter
