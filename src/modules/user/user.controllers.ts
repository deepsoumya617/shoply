import { Request, Response } from 'express'
import { db } from '../../config/db'
import { users } from '../../db/schema'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { eq } from 'drizzle-orm'

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
