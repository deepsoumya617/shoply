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
import { comparePassword, hashPassword, hashToken } from '../../utils/hash'
import { generateToken, verifyToken } from '../../utils/jwt'
import crypto from 'node:crypto'
import {
  enqueueForgotPasswordEmail,
  enqueueLoginEmail,
  enqueueVerificationEmail,
} from '../../jobs/auth.job'
import { UAParser } from 'ua-parser-js'
import { googleClient } from '../../config/googleClient'
import { env } from '../../config/env'

// sign in with google
export async function googleAuth(req: Request, res: Response) {
  try {
    // make a random state for csrf protection
    const state = crypto.randomBytes(16).toString('hex')

    // store in cookie
    res.cookie('oauth_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      maxAge: 5 * 60 * 1000,
    })

    // generate google auth url
    const redirectUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid',
      ],
      state,
    })

    return res.redirect(redirectUrl)
  } catch (error) {
    console.error('Google OAuth redirect failed: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function googleAuthCallback(req: Request, res: Response) {
  const code = req.query.code as string
  const state = req.query.state as string
  const storedState = req.cookies.oauth_state as string

  if (!code || !state) {
    return res
      .status(400)
      .json({ message: 'Missing authorization code or state' })
  }

  // states didnt match
  if (state !== storedState) {
    return res.status(403).json({ message: 'Invalid state parameter' })
  }

  // clear the cookie
  res.clearCookie('oauth_state')

  try {
    // exchange the code for token
    const { tokens } = await googleClient.getToken(code)
    const idToken = tokens.id_token

    if (!idToken) {
      return res.status(400).json({ message: 'Missing ID token from Google' })
    }

    // verify idToken
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()

    if (!payload) {
      return res.status(400).json({ message: 'Invalid Google token' })
    }

    if (!payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Email not available from Google account',
      })
    }

    const email = payload.email
    const firstName =
      payload.given_name || `user${crypto.randomInt(10000, 99999)}`

    // check if user exists
    let [user] = await db.select().from(users).where(eq(users.email, email))

    // checks if user exist but uses email+password based login
    if (user && user.authProvider === 'email') {
      return res.status(409).json({
        success: false,
        message:
          'An account with this email already exists. Please login with your password.',
      })
    }

    // if user doesnt exist, first create user
    // then log in the user automatically. otherwise,
    // directly login the user -> generate tokens
    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          firstName,
          isVerified: true,
          authProvider: 'google',
        })
        .returning()

      user = newUser
    }

    // generate tokens
    const accessToken = generateToken({ userId: user.id })
    const refreshToken = crypto.randomBytes(64).toString('hex')
    const hashedRefreshToken = hashToken(refreshToken)
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    // set token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    // save hashed refresh token in db
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
    const verificationToken = generateToken({ email })

    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        authProvider: 'email',
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

    // user exists -> but loggedin with google
    if (user && user.authProvider === 'google') {
      return res.status(400).json({
        success: false,
        message:
          'You used Google as your auth provider. Please sign in with Google.',
      })
    }

    // user exists -> compare password
    const isPasswordValid = await comparePassword(password, user.password!)

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
    const hashedRefreshToken = hashToken(refreshToken)
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
    const hashedPassword = await hashPassword(password)

    // update user with new password
    await db
      .update(users)
      .set({
        password: hashedPassword,
      })
      .where(eq(users.id, userId))

    // delete token
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id))

    res.status(201).json({ message: 'password updated succesfully!' })
  } catch (error) {
    console.log('Reset password error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// refresh tokens
export async function refreshAccessToken(req: Request, res: Response) {
  // console.log(req.cookies)
  // get the refresh token from req.cookies
  const refreshToken = req.cookies.refreshToken

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh Token not provided' })
  }

  // hash the token
  const hashedToken = hashToken(refreshToken)
  // console.log(hashedToken)

  try {
    // find in db
    const [token] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashedToken))

    // check if token exists
    if (!token) {
      return res.status(403).json({ message: 'Refresh Token does not exist' })
    }

    // check expiry
    if (token.expiresAt < new Date()) {
      return res.status(403).json({ message: 'Refresh Token expired' })
    }

    const accessToken = generateToken({ userId: token.userId })

    res.status(200).json({
      success: true,
      accessToken,
    })
  } catch (error) {
    console.error('Refresh token error: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// logout user
export async function logOutUser(req: Request, res: Response) {
  const refreshToken = req.cookies.refreshToken

  try {
    if (refreshToken) {
      const hashedRefreshToken = hashToken(refreshToken)

      // delete from db
      await db
        .delete(refreshTokens)
        .where(eq(refreshTokens.tokenHash, hashedRefreshToken))
    }

    // clear from the browser
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    })

    res.status(200).json({ success: true, message: 'Logged out successfully!' })
  } catch (error) {
    console.error('Log out error: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
