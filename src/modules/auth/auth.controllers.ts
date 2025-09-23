import { Request, Response } from 'express'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema'
import { db } from '../../config/db'
import { and, eq } from 'drizzle-orm'
import { refreshTokens, users } from '../../db/schema'
import { compareHash, hashString } from '../../utils/bcrypt'
import { generateToken, verifyToken } from '../../utils/jwt'
import crypto from 'node:crypto'
import {
  enqueueForgotPasswordEmail,
  enqueueLoginEmail,
  enqueueVerificationEmail,
} from '../../jobs/email.queue'
import { UAParser } from 'ua-parser-js'

// register user
export async function registerUser(req: Request, res: Response) {
  const result = registerSchema.safeParse(req.body)

  // validation failed
  if (!result.success) {
    console.log('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { firstName, lastName, email, password } = result.data

  try {
    // user already exists
    const [user] = await db.select().from(users).where(eq(users.email, email))
    if (user) {
      return res.status(400).json({
        status: 'failed',
        message: 'User with this email already exists',
      })
    }

    // create user
    // hash password
    const hashedPassword = await hashString(password)

    // generate token
    const verificationToken = generateToken({ email })

    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        verificationToken,
      })
      .returning()

    // enqueue verification email
    await enqueueVerificationEmail({ email, token: verificationToken })

    res.status(201).json({
      status:
        'Registration successful. Please verify your email to activate your account.',
      user: newUser,
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// verify user email
export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.query

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing token' })
  }

  try {
    const decodedToken = verifyToken<{ email: string }>(token)
    const { email } = decodedToken

    // find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.verificationToken, token)))

    // user not found or token mismatch
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Invalid token or user not found' })
    }

    // check if user is already verified
    if (user.isVerified) {
      return res.status(401).json({ message: 'User is already verified' })
    }

    // update user verification status
    await db
      .update(users)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(users.id, user.id))

    res.status(200).json({ message: 'Email verified successfully' })
  } catch (error) {
    console.log('Email verification error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// login user
export async function loginUser(req: Request, res: Response) {
  const result = loginSchema.safeParse(req.body)

  if (!result.success) {
    console.log('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { email, password } = result.data

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email))

    // user doesnt exist
    if (!user) {
      return res
        .status(401)
        .json({ message: `user with ${email} doesnt exist!` })
    }

    // user exists -> compare password
    const isPasswordValid = await compareHash(password, user.password)

    // wrong password
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: 'Wrong password, please try again!' })
    }

    // user not verified
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: 'Please verify your email first!' })
    }

    const accessToken = generateToken({ userId: user.id })
    const refreshToken = crypto.randomBytes(64).toString('hex') // random string
    const hashedRefreshToken = await hashString(refreshToken)
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)


    // set refreshToken in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: true,
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    // save hashedRefreshToken in db for later comparison
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashedRefreshToken,
      expiresAt: refreshTokenExpiry,
    })

    // send login alert email
    const ip = req.ip || 'Unknown IP'
    const userAgent = req.headers['user-agent']
    const parser = new UAParser(userAgent)
    const deviceInfo = `${parser.getBrowser().name} on ${parser.getOS().name}`

    await enqueueLoginEmail({ email, ip, deviceInfo })

    res.status(200).json({
      message:
        'Login successful! Save the token securely. You can access the token from your email too!',
      accessToken,
      user: {
        name: user.firstName,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// forget password
export async function forgotPassword(req: Request, res: Response) {
  const result = forgotPasswordSchema.safeParse(req.body)

  // validate
  if (!result.success) {
    console.log('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { email } = result.data

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email))

    if (!user) {
      return res
        .status(401)
        .json({ message: `user with ${email} doesnt exist!` })
    }

    // user not verified
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: 'Please verify your email first!' })
    }

    // generate token to reset password
    const token = generateToken({ userId: user.id })

    // send mail through workers
    await enqueueForgotPasswordEmail({ email, token })

    res.status(200).json({
      message: 'Reset password email sent successfully',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// reset password
export async function resetPassword(req: Request, res: Response) {
  const { token } = req.query
  const result = resetPasswordSchema.safeParse(req.body)

  if (!result.success) {
    console.log('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing token' })
  }

  const { password } = result.data

  try {
    const decodedToken = verifyToken<{ userId: string }>(token)
    const { userId } = decodedToken

    // find user by id
    const [user] = await db.select().from(users).where(eq(users.id, userId))

    // user doesnt exist
    if (!user) {
      return res.status(401).json({
        message: 'User doesnt exist!',
      })
    }

    // user not verified
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: 'Please verify your email first!' })
    }

    // update password
    const hashedPassword = await hashString(password)

    await db
      .update(users)
      .set({
        password: hashedPassword,
      })
      .where(eq(users.id, userId))

    res.status(201).json({ message: 'password updated succesfully!' })
  } catch (error) {
    console.log('Reset password error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
