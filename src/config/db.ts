import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../config/env'
import * as schema from '../db/schema'

const pool = new Pool({
  connectionString: env.DATABASE_URL,
})

export const db = drizzle(pool, { schema })

// connect to database and verify connection
export async function connectDB() {
  try {
    await pool.connect()
    console.log('Connected to the database successfully!')
  } catch (error) {
    console.error('Failed to connect to the database:', error)
    process.exit(1)
  }
}
