import {
  integer,
  pgTable,
  uuid,
  pgEnum,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { users } from './user'

// order status enum
export const orderStatusEnum = pgEnum('order_status', [
  'AWAITING_PAYMENT',
  'PAID',
  'CANCELLED',
  'REFUNDED',
])

// tracking status
export const trackingStatusEnum = pgEnum('tracking_status', [
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
])

// orders table -> not completed fully
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    totalAmount: integer('total_amount').notNull(),
    orderStatus: orderStatusEnum().notNull().default('AWAITING_PAYMENT'),
    trackingStatus: trackingStatusEnum().notNull().default('SHIPPED'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => [
    index('idx_orders_order_status').on(table.orderStatus),
    index('idx_orders_created_at').on(table.createdAt),
  ]
)
