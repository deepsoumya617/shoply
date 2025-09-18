import { z } from 'zod'

// base schemas
const nameSchema = z
  .string()
  .min(5, 'Name is required')
  .max(50, 'Name must be under 50 characters')
  .transform(str => str.trim())

const descriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters long')
  .max(500, 'Description must be under 500 characters')
  .transform(str => str.trim())

const priceSchema = z.number().positive('Price must be greater than zero')

const stockSchema = z.number().min(0, 'Stock quantity must be 0 or more')

export const uuidSchema = z.uuid('Invalid UUID')

// composite schemas
export const createProductSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  stockQuantity: stockSchema.optional(),
  sellerId: uuidSchema,
  categoryId: uuidSchema,
})

// PUT
export const updateProductSchema = createProductSchema
  .omit({ sellerId: true })
  .partial()

// for IDs only from -> req.params
export const productIdSchema = z.object({
  id: uuidSchema,
})
