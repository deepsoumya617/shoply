import { Router } from 'express'
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
  verifyEmail,
} from './auth.controller'

const authRouter = Router()

// auth routes
authRouter.post('/register', registerUser)
authRouter.get('/verify-email', verifyEmail)
authRouter.post('/login', loginUser)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)

export default authRouter
