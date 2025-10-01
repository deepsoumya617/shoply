import { pgTable, uuid } from 'drizzle-orm/pg-core'

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
})
