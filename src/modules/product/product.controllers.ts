import { Request, Response } from 'express'
import { createProductSchema, getProductByIdSchema } from './product.schema'
import { db } from '../../config/db'
import { products } from '../../db/schema'
import { eq } from 'drizzle-orm'

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

export async function getProductById(req: Request, res: Response) {
  const result = getProductByIdSchema.safeParse(req.params)

  // validate input data
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { id } = result.data

  try {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))

    if (!product) {
      return res.status(400).json({ message: 'Product does not exist' })
    }

    res.status(200).json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}
