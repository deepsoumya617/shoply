import { db } from '../../config/db'
import { categories } from '../schema'

export async function seedCategories() {
  // insert categories
  await db
    .insert(categories)
    .values([
      { name: 'Accessories' },
      { name: 'Computers' },
      { name: 'Electronics' },
      { name: 'Gaming' },
      { name: 'Home Appliances' },
      { name: 'Laptops' },
      { name: 'Mobiles' },
      { name: 'Wearables' },
    ])
}
