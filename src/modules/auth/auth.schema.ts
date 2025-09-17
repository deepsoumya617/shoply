import z from 'zod'

const emailSchema = z.email('Invalid email address')
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')

export const registerSchema = z.object({
  firstName: z.string().min(3, 'First name must be at least 3 characters long'),
  lastName: z.string().optional(),
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  password: passwordSchema,
})
