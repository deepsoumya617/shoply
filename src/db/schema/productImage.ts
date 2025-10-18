import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { products } from './product'

export const productImages = pgTable('product_images', {
  id: uuid('id').notNull().defaultRandom(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id),
  imageUrl: varchar('image_url', { length: 1024 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
