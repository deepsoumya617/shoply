import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { carts } from './cart'
import { products } from './product'

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id')
      .notNull()
      .references(() => carts.id),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull().default(1),
    addedAt: timestamp('added_at').defaultNow(),
  },
  table => [
    uniqueIndex('cart_id_product_id_idx').on(table.cartId, table.productId),
  ]
)
