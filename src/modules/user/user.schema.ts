import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(3, 'First name must be at least 3 characters long')
    .optional(),
  lastName: z.string().optional(),
  email: z.email('Invalid email address').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .optional(),
})
