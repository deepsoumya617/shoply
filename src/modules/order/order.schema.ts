import { z } from 'zod'

export const createOrderSchema = z.object({
  selectedCartItemIds: z.array(z.uuid()).optional().default([]),
})

export const orderIdSchema = z.object({
  id: z.uuid('Invalid UUID'),
})
