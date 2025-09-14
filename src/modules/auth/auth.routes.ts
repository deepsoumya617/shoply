import { Router } from 'express'
import { loginUser, registerUser, verifyEmail } from './auth.controller'

const authRouter = Router()

// auth routes
authRouter.post('/register', registerUser)
authRouter.get('/verify-email', verifyEmail)
authRouter.post('/login', loginUser)

export default authRouter
