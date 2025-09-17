import { Request, Response } from 'express'
import { db } from '../../config/db'
import { products, users } from '../../db/schema'

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

export async function getAllProducts(req: Request, res: Response) {
  try {
    const allProducts = await db.select().from(products)
    res.status(200).json({
      success: true,
      productCount: allProducts.length,
      allProducts,
    })
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}
