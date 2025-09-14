import { Request, Response } from 'express'
import { registerSchema } from './auth.schema'
import { db } from '../../config/db'
import { and, eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { hashPassword } from '../../utils/bcrypt'
import { generateToken, verifyToken } from '../../utils/jwt'
import { enqueueVerificationEmail } from '../../jobs/email.queue'

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
    const hashedPassword = await hashPassword(password)

    // generate token
    const verificationToken = generateToken({ email }, 'register')

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
        .status(400)
        .json({ message: 'Invalid token or user not found' })
    }

    // check if user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' })
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
