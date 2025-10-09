import { z } from 'zod'

export const createOrderSchema = z.object({
  selectedCartItemIds: z.array(z.uuid()).optional().default([]),
})
