import { Request, Response } from 'express'
import { db } from '../../config/db'
import { users } from '../../db/schema'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { eq, count } from 'drizzle-orm'
import { getUsersSchema, updateProfileSchema } from './user.schema'
import { hashPassword } from '../../utils/bcrypt'

// admin only
export async function getAllUsers(req: Request, res: Response) {
  const result = getUsersSchema.safeParse(req.query)

  // validate input data
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { limit, page } = result.data
  const offset = (page - 1) * limit

  try {
    const [result] = await db.select({ count: count() }).from(users)

    const totalPages = result.count > 0 ? Math.ceil(result.count / limit) : 1

    if (page > totalPages) {
      return res.json({
        message: `page no should be less than or equal to ${totalPages}`,
      })
    }

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
      .limit(limit)
      .offset(offset)

    res.status(200).json({
      success: true,
      data: allUsers,
      meta: {
        meta: {
          totalUsers: result.count,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      },
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
