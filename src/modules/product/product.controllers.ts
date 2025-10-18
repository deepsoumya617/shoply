import { Request, Response } from 'express'
import {
  createProductSchema,
  getProductsSchema,
  productIdSchema,
  updateProductSchema,
} from './product.schema'
import { db } from '../../config/db'
import { categories, productImages, products } from '../../db/schema'
import { eq, count, desc } from 'drizzle-orm'
import redis from '../../config/redis'
import { enqueueImageUploadJob } from '../../jobs/image.job'

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
  const result = getProductsSchema.safeParse(req.query)

  // validate input data
  if (!result.success) {
    console.error('Input validation failed: ', result.error)
    return res.status(400).json({
      status: 'failed',
      message: 'Invalid input data. Please check and try again.',
    })
  }

  const { page, limit } = result.data
  const offset = (page - 1) * limit

  try {
    // get total no of products
    const result = await db.select({ count: count() }).from(products)
    const rowCount = result[0].count

    // get total pages
    const totalPages = rowCount > 0 ? Math.ceil(rowCount / limit) : 1

    // handle edge case
    if (page > totalPages) {
      return res.json({
        message: `page no should be less than or equal to ${totalPages}`,
      })
    }

    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset)

    res.status(200).json({
      success: true,
      data: allProducts,
      meta: {
        totalProducts: rowCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    })
  } catch (error) {
    console.error('Error getting products:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}

export async function getProductById(req: Request, res: Response) {
  const result = productIdSchema.safeParse(req.params)

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
      return res.status(404).json({ message: 'Product does not exist' })
    }

    res.status(200).json({
      success: true,
      product,
    })
  } catch (error) {
    console.error(`Error getting product with id ${id} :`, error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}

export async function updateProductById(req: Request, res: Response) {
  const idResult = productIdSchema.safeParse(req.params)
  const bodyResult = updateProductSchema.safeParse(req.body)

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

  try {
    const [updatedProduct] = await db
      .update(products)
      .set(bodyResult.data)
      .where(eq(products.id, id))
      .returning()

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product does not exist' })
    }

    res.status(200).json({
      success: true,
      updatedProduct,
    })
  } catch (error) {
    console.error('Error updating product: ', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}

export async function deleteProductById(req: Request, res: Response) {
  const result = productIdSchema.safeParse(req.params)

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
    await db.delete(products).where(eq(products.id, id))

    res.status(200).json({ message: 'Product deleted successfully!' })
  } catch (error) {
    console.error('Error deleting product: ', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}

export async function getProductByCategories(req: Request, res: Response) {
  const result = productIdSchema.safeParse(req.params)

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
    const productsByCategories = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, id))

    if (!productsByCategories) {
      return res.status(404).json({
        success: false,
        message: `Products with category id ${id} does not exit`,
      })
    }

    res.status(200).json({
      success: true,
      productsByCategories,
    })
  } catch (error) {
    console.error('Error getting product by categories: ', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching users',
    })
  }
}

export async function getAllCategories(req: Request, res: Response) {
  const cacheKey = 'categories:all' // set the key first

  try {
    // check in cache first with the key
    const cachedData = await redis.get(cacheKey)

    if (cachedData) {
      console.log('Cache hit for categories')
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedData),
      })
    }

    // its not in the cache, so i have to fetch it first from db
    console.log('Cache miss for categories. Fetching from db.')
    const allCategories = await db.select().from(categories)

    if (!allCategories || allCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No categories found',
      })
    }

    // and then put it in cache
    await redis.set(cacheKey, JSON.stringify(allCategories), 'EX', 1800)

    res.status(200).json({
      success: true,
      allCategories,
    })
  } catch (error) {
    console.error('Error getting categories: ', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching categories',
    })
  }
}

export async function uploadProductImage(req: Request, res: Response) {
  const result = productIdSchema.safeParse(req.params)

  // validate id
  if (!result.success) {
    console.error('Invalid ID: ', result.error)
    return res.status(403).json({
      status: 'failed',
      message: 'Invalid product id. Please check and try again.',
    })
  }

  const { id } = result.data
  const files = req.files as Express.Multer.File[] | undefined

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' })
  }

  try {
    // check if there already 3 imgs for a product in db
    const rows = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id))

    if (rows.length + files.length > 3) {
      return res
        .status(400)
        .json({ message: 'Each product can have upto 3 images.' })
    }

    // upload every image through workers
    for (const file of files) {
      await enqueueImageUploadJob({ productId: id, fileBuffer: file.buffer })
    }

    return res.status(200).json({ message: 'Images are queued for upload' })
  } catch (error) {
    console.error('Error uploading images: ', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
