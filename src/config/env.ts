import dotenv from 'dotenv'

dotenv.config() // Load environment variables from .env file

export const env = {
  PORT: process.env.PORT || 8080,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
}
