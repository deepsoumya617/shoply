import { integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core'
import { orders } from './order'
import { products } from './product'

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  productName: varchar('product_name', { length: 255 }).notNull(),
  productPrice: integer('product_price').notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: integer('subtotal').notNull(),
})
