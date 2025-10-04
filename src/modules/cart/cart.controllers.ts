import { AuthRequest } from '../../middlewares/auth.middleware'
import { Response } from 'express'
import {
  addItemToCartSchema,
  cartItemsIdSchema,
  cartItemsQuantitySchema,
} from './cart.schema'
import { db } from '../../config/db'
import { carts } from '../../db/schema/cart'
import { eq, sql, and } from 'drizzle-orm'
import { cartItems } from '../../db/schema/cartItems'
import { products } from '../../db/schema'
import { enqueueCartJobs } from '../../jobs/cart.job'

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

    // update lastActivity
    await db
      .update(carts)
      .set({ lastActivity: new Date() })
      .where(eq(carts.id, cart.id))

    // ping workers
    await enqueueCartJobs(cart.id, req.user!.email)

    res.status(200).json({
      success: true,
      message: 'Item added to cart successfully!',
    })
  } catch (error) {
    console.error('Failed to add product to cart: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getCartItems(req: AuthRequest, res: Response) {
  try {
    // first fetch the cart
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.userId))

    // maybe cart is empty
    if (!cart) {
      return res.json({
        success: true,
        cart: {
          id: null,
          items: [],
          totalPrice: 0,
        },
      })
    }

    // fetch cart items w. product details -> name desc price
    const items = await db
      .select({
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        name: products.name,
        description: products.description,
        price: products.price,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.cartId, cart.id))

    // calculate total
    const itemsWSubtotal = items.map(item => ({
      ...item,
      subtotal: item.quantity * item.price,
    }))

    const totalPrice = itemsWSubtotal.reduce((sum, i) => sum + i.subtotal, 0)

    // update lastActivity
    await db
      .update(carts)
      .set({ lastActivity: new Date() })
      .where(eq(carts.id, cart.id))

    // ping workers
    await enqueueCartJobs(cart.id, req.user!.email)

    // send response
    res.status(200).json({
      success: true,
      cart: {
        id: cart.id,
        items,
        totalPrice,
      },
    })
  } catch (error) {
    console.error('Failed to fetch cart items: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function updateQuantity(req: AuthRequest, res: Response) {
  const idResult = cartItemsIdSchema.safeParse(req.params)
  const bodyResult = cartItemsQuantitySchema.safeParse(req.body)

  // validate id and body
  if (!idResult.success) {
    console.error('Invalid ID: ', idResult.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid product id. Please check and try again.',
    })
  }

  if (!bodyResult.success) {
    console.error('Input validation failed: ', bodyResult.error)
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { id } = idResult.data
  const { quantity } = bodyResult.data

  try {
    // fetch the user cart first
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.userId))

    // maybe cart is empty
    if (!cart) {
      return res.json({
        success: true,
        message: 'cart is empty',
      })
    }

    // update quantity
    await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, id)))

    // update lastActivity
    await db
      .update(carts)
      .set({ lastActivity: new Date() })
      .where(eq(carts.id, cart.id))
    // ping workers
    await enqueueCartJobs(cart.id, req.user!.email)

    res.status(200).json({
      success: true,
      message: 'Product quantity updated successfully!',
    })
  } catch (error) {
    console.error('Failed to update quantity: ', error)
    res.status(500).json({ message: 'Invalid server error' })
  }
}

export async function deleteItemById(req: AuthRequest, res: Response) {
  const result = cartItemsIdSchema.safeParse(req.params)

  // validate input
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { id } = result.data

  try {
    // fetch the user cart first
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.userId))

    // maybe cart is empty
    if (!cart) {
      return res.json({
        success: true,
        message: 'cart is empty',
      })
    }

    // delete item
    await db.delete(cartItems).where(eq(cartItems.productId, id))

    // update lastActivity
    await db
      .update(carts)
      .set({ lastActivity: new Date() })
      .where(eq(carts.id, cart.id))

    // ping workers
    await enqueueCartJobs(cart.id, req.user!.email)

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully from cart',
    })
  } catch (error) {
    console.error('Failed deleting cart item: ', error)
    res.status(500).json({
      message: 'Invalid sever error',
    })
  }
}
