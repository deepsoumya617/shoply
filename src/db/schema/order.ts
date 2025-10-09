import { integer, pgTable, uuid, pgEnum, timestamp } from 'drizzle-orm/pg-core'
import { users } from './user'

// order status enum
const ordersEnum = pgEnum('order_status', [
  'CREATED',
  'AWAITING_PAYMENT',
  'PAID',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
])

// orders table -> not completed fully
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  totalAmount: integer('total_amount').notNull(),
  status: ordersEnum().notNull().default('CREATED'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
