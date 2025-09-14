import z from 'zod'

export const registerSchema = z.object({
  firstName: z.string().min(3, 'First name must be at least 3 characters long'),
  lastName: z.string().optional(),
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
})

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
})

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
})
