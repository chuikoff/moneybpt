import Dexie, { type Table } from 'dexie'
import type { Category, Expense } from '../types'
import { SEED_CATEGORIES } from './seed'

export class MoneyDB extends Dexie {
  expenses!: Table<Expense, number>
  categories!: Table<Category, number>
  meta!: Table<{ key: string; value: string }, string>

  constructor() {
    super('moneybpt')
    this.version(1).stores({
      expenses: '++id, date, category, group, dedupeHash, createdAt',
      categories: '++id, &name, group, sortOrder',
      meta: 'key',
    })
  }
}

export const db = new MoneyDB()

export async function ensureSeeded(): Promise<void> {
  const seeded = await db.meta.get('seeded')
  if (seeded?.value === '1') return

  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd(SEED_CATEGORIES)
  }
  await db.meta.put({ key: 'seeded', value: '1' })
}
