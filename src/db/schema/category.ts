import { pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'

// enums for categories
export const categoriesEnum = pgEnum('category_name', [
  'Electronics',
  'Mobiles',
  'Laptops',
  'Accessories',
  'Computers',
  'Gaming',
  'Home Appliances',
  'Wearables',
])

// categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: categoriesEnum('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
