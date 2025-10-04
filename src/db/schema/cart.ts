import { integer, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './user'

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  // reminderSent: integer('reminder_sent').default(0).notNull(),
  lastActivity: timestamp('last_activity', { mode: 'date' })
    .defaultNow()
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})
