import { integer, pgTable, uuid, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { users } from './user'

// order status enum
export const ordersEnum = pgEnum('order_status', [
  'AWAITING_PAYMENT',
  'PAID',
  'CANCELLED',
  'REFUNDED',
])

// orders table -> not completed fully
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  totalAmount: integer('total_amount').notNull(),
  orderStatus: ordersEnum().notNull().default('AWAITING_PAYMENT'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
