import { Request, Response } from 'express'
import { db } from '../../config/db'
import { users } from '../../db/schema'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { eq } from 'drizzle-orm'
import { updateProfileSchema } from './user.schema'
import { hashPassword } from '../../utils/bcrypt'

// admin only
export async function getAllUsers(req: Request, res: Response) {
  try {
    // fetch users, exclude password
    const allUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        isVerified: users.isVerified,
        sellerReqPending: users.sellerRequestPending,
      })
      .from(users)

    res.status(200).json({
      success: true,
      userCount: allUsers.length,
      data: allUsers,
    })
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}

export async function getMyProfile(req: AuthRequest, res: Response) {
  try {
    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        sellerRequestPending: users.sellerRequestPending,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.userId))

    res.status(200).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const result = updateProfileSchema.safeParse(req.body)

  // validate input data
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  // remove undefined fields
  let cleanedData = Object.fromEntries(
    Object.entries(result.data).filter(([_, v]) => v !== undefined)
  )

  if (cleanedData.password) {
    const hashedPassword = await hashPassword(cleanedData.password)
    cleanedData = { ...cleanedData, password: hashedPassword }
  }

  try {
    const [user] = await db
      .update(users)
      .set(cleanedData)
      .where(eq(users.id, req.user!.userId))
      .returning()

    res
      .status(201)
      .json({ success: true, message: 'Profile updated successfully', user })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}
