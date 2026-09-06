export interface Category {
  id?: number
  name: string
  group?: string
  color?: string
  sortOrder: number
}

export interface Expense {
  id?: number
  amount: number
  category: string
  group?: string
  date: string // YYYY-MM-DD
  comment?: string
  currency: string
  account?: string
  dedupeHash: string
  createdAt: number
}

export interface ImportRow {
  date: string
  amount: number
  currency: string
  account: string
  category: string
  group: string
  comment: string
}

export interface ImportSummary {
  total: number
  imported: number
  duplicates: number
  skipped: number
  errors: string[]
}

export type TabId = 'dashboard' | 'history' | 'add' | 'categories' | 'settings'
