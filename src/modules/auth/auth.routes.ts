import { Router } from 'express'
import { registerUser, verifyEmail } from './auth.controller'

const authRouter = Router()

// auth routes
authRouter.post('/register', registerUser)
authRouter.get('/verify-email', verifyEmail)

export default authRouter
