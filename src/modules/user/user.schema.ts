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

export const getUsersSchema = z.object({
  page: z.coerce
    .number()
    .int('Page no should be an integer')
    .min(1, 'Page no must be 1 or more')
    .default(1),
  limit: z.coerce
    .number()
    .int('Limit should be an integer')
    .min(1, 'Limit must be 1 or more')
    .max(10, 'Limit must be less than or equal to 10')
    .default(5),
})
