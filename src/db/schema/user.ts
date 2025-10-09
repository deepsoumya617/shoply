import {
  varchar,
  uuid,
  pgTable,
  boolean,
  pgEnum,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'

// users enum
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'SELLER', 'CUSTOMER'])

// users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    firstName: varchar('first_name', { length: 255 }).notNull(),
    lastName: varchar('last_name', { length: 255 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    role: userRoleEnum().default('CUSTOMER').notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    verificationToken: varchar('verification_token', { length: 255 }),
    sellerRequestPending: boolean('seller_request_pending')
      .default(false)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  table => [index('idx_users_verification_token').on(table.verificationToken)]
)
