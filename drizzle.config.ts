import { defineConfig } from 'drizzle-kit'
import { env } from './src/config/env'


export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL!,
    // url: 'postgres://deep:notsosecure@localhost:5432/ecommerce_test',
  },
})
