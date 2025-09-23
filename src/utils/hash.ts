import bcrypt from 'bcrypt'
import crypto from 'node:crypto'

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(password, saltRounds)
  return hashedPassword
}

export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword)
}
