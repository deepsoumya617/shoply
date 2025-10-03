import { pgTable, uuid } from 'drizzle-orm/pg-core'
import { users } from './user'

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
})
