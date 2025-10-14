import { Response } from 'express'
import { AuthRequest } from '../../middlewares/auth.middleware'
import { createOrderSchema, orderIdSchema } from './order.schema'
import { db } from '../../config/db'
import { cartItems, carts, orderItems, orders, products } from '../../db/schema'
import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import {
  enqueueCreateOrderJob,
  enqueuePaymentJob,
  enqueueShipmentJob,
} from '../../jobs/order.job'

export async function createOrder(req: AuthRequest, res: Response) {
  const result = createOrderSchema.safeParse(req.body)

  // validate input data
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { selectedCartItemIds } = result.data

  try {
    // fetch the cart first
    const [cart] = await db
      .select()
      .from(carts)
      .where(eq(carts.userId, req.user!.userId))

    // maybe cart is empty
    if (!cart) {
      return res.json({
        success: true,
        message: 'Your cart is empty. add items to place order',
      })
    }

    // fetch selected cart items
    const items = await db
      .select({
        cartItemId: cartItems.id,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        productName: products.name,
        productPrice: products.price,
        productStock: products.stockQuantity,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(
        selectedCartItemIds.length > 0
          ? and(
              eq(cartItems.cartId, cart.id),
              inArray(cartItems.id, selectedCartItemIds)
            )
          : eq(cartItems.cartId, cart.id)
      )

    if (items.length === 0) {
      return res.status(404).json({
        message: 'Your cart is empty. Add items to place order.',
      })
    }

    // verify stock
    for (const item of items) {
      if (item.quantity > item.productStock) {
        return res
          .status(400)
          .json({ message: `Not enough stock for ${item.productName}` })
      }
    }

    // calculate subtotal
    const totalAmount = items.reduce(
      (sum, i) => sum + i.quantity * i.productPrice,
      0
    )

    // declare order object to use outside transaction
    let orderInfo: { id: string; totalAmount: number } | undefined

    // begin the db transaction
    await db.transaction(async tx => {
      // create order first
      const [order] = await tx
        .insert(orders)
        .values({
          userId: req.user!.userId,
          totalAmount,
        })
        .returning()

      // save [order] in orderInfo to use later
      orderInfo = { id: order.id, totalAmount: order.totalAmount }

      // create order items
      for (const e of items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          productId: e.productId,
          productName: e.productName,
          productPrice: e.productPrice,
          quantity: e.quantity,
          subtotal: e.quantity * e.productPrice,
        })
      }

      // decrease product stock
      for (const e of items) {
        const result = await tx
          .update(products)
          .set({
            stockQuantity: sql`${products.stockQuantity} - ${e.quantity}`,
          })
          .where(
            and(
              eq(products.id, e.productId),
              gte(products.stockQuantity, e.quantity) // ensures enough stock
            )
          )
          .returning({ updatedId: products.id })

        // Check if update actually happened
        if (result.length === 0) {
          throw new Error(`Insufficient stock for product: ${e.productName}`)
        }
      }

      // clear ordered items from cart
      if (selectedCartItemIds.length > 0) {
        await tx
          .delete(cartItems)
          .where(
            and(
              eq(cartItems.cartId, cart.id),
              inArray(cartItems.id, selectedCartItemIds)
            )
          )
      } else {
        await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id))
      }
    })

    // check if order is created or not
    if (!orderInfo) {
      throw new Error('Order was not created')
    }

    // send mail
    await enqueueCreateOrderJob(
      req.user!.email,
      orderInfo.id,
      orderInfo.totalAmount
    )

    console.log(orderInfo)

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
    })
  } catch (error) {
    console.error('Error placing order: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function getAllOrders(req: AuthRequest, res: Response) {
  try {
    // fetch all orders
    const allOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, req.user!.userId))
      .orderBy(desc(orders.createdAt))

    if (allOrders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'There are no active orders.' })
    }

    // fetch all order items for all the orders
    let orderWithItems: {
      order: (typeof allOrders)[0]
      items: {
        productName: string
        productPrice: number
        quantity: number
        subtotal: number
      }[]
    }[] = []

    for (const order of allOrders) {
      // fetch items here
      const items = await db
        .select({
          productName: orderItems.productName,
          productPrice: orderItems.productPrice,
          quantity: orderItems.quantity,
          subtotal: orderItems.subtotal,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))

      // push into orderWithItems
      orderWithItems.push({
        order,
        items,
      })
    }

    res.status(200).json({
      success: true,
      message: 'Orders fetched successfully.',
      orderWithItems,
    })
  } catch (error) {
    console.error('Error placing order: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

export async function payForOrder(req: AuthRequest, res: Response) {
  const result = orderIdSchema.safeParse(req.params)

  // validate input data
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { id } = result.data

  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id))

    if (!order) {
      return res.status(404).json({
        message: 'Order not found.',
      })
    }

    // check if the order is cancelled. refunded or paid
    const forbiddenMessages = {
      CANCELLED: 'The order is cancelled. You can’t pay anymore.',
      PAID: 'The payment has already been completed.',
      REFUNDED: 'You can’t pay for an order that has been refunded.',
    }

    if (
      order.orderStatus !== 'AWAITING_PAYMENT' &&
      forbiddenMessages[order.orderStatus]
    ) {
      return res.status(403).json({
        message: forbiddenMessages[order.orderStatus],
      })
    }

    // process payment
    await db
      .update(orders)
      .set({ orderStatus: 'PAID' })
      .where(eq(orders.id, order.id))

    // trigger background workers
    await enqueuePaymentJob(req.user!.email, order.id)
    await enqueueShipmentJob(req.user!.email, order.id)

    res.status(200).json({
      success: true,
      message: 'Payment has been completed succesfully!',
    })
  } catch (error) {
    console.error('Error placing order: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
