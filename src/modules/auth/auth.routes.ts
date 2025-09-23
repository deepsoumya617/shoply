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

const authRouter = Router()

// auth routes
authRouter.post('/register', registerUser)
authRouter.get('/verify-email', verifyEmail)
authRouter.post('/login', loginUser)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.get('/refresh', refreshAccessToken)
authRouter.get('/logout', logOutUser)

export default authRouter
