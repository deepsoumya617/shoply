import { z } from 'zod'

const productIdSchema = z.uuid('invalid uuid')
const quantitySchema = z
  .number()
  .min(1, 'product quantity must be greater than or equal to 1')

// add to cart
export const addItemToCartSchema = z.object({
  productId: productIdSchema,
  quantity: quantitySchema,
})

// id schema
export const cartItemsIdSchema = z.object({
  id: productIdSchema,
})

// quantity schema
export const cartItemsQuantitySchema = z.object({
  quantity: quantitySchema,
})
