import { Request, Response } from 'express'
import { createProductSchema } from './product.schema'
import { db } from '../../config/db'
import { products } from '../../db/schema'

export async function createProduct(req: Request, res: Response) {
  const result = createProductSchema.safeParse(req.body)

  // validate input data
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  // destructure data
  const { name, description, price, stockQuantity, sellerId, categoryId } =
    result.data

  try {
    // create product and return
    const [product] = await db
      .insert(products)
      .values({
        name,
        description,
        price,
        stockQuantity,
        sellerId,
        categoryId,
      })
      .returning()

    res.status(201).json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Product creation error: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
