import { AuthRequest } from '../../middlewares/auth.middleware'
import { Response } from 'express'
import { addItemToCartSchema } from './cart.schema'
import { db } from '../../config/db'
import { carts } from '../../db/schema/cart'
import { eq, sql } from 'drizzle-orm'
import { cartItems } from '../../db/schema/cartItems'

export async function addItems(req: AuthRequest, res: Response) {
  const result = addItemToCartSchema.safeParse(req.body)

  // validate input
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }
  
  const { productId, quantity } = result.data

  try {
    // first we have to check if the user has a cart
    // if not, we have to create the cart first
    let [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.userId))

    if (!cart) {
      ;[cart] = await db
        .insert(carts)
        .values({ userId: req.user!.userId })
        .returning()
    }

    // insert into carts
    await db
      .insert(cartItems)
      .values({ productId, quantity, cartId: cart.id })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.productId],
        set: { quantity: sql`${cartItems.quantity} + EXCLUDED.quantity` }, // increase qunatity
      })

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully!',
    })
  } catch (error) {
    console.error('Failed to add product to cart: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getCartItems(req: AuthRequest, res: Response) {}