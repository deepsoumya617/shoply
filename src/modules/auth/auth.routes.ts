import { Router } from 'express'
import { registerUser } from './auth.controller'

const authRouter = Router()

// auth routes
authRouter.post('/register', registerUser)

export default authRouter
