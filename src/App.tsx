import { useCallback, useEffect, useRef, useState } from 'react'
import { liveQuery } from 'dexie'
import { db, ensureSeeded } from './db/database'
import type { Category, Expense, TabId } from './types'
import { BottomNav } from './components/BottomNav'
import { Dashboard } from './components/Dashboard'
import { History } from './components/History'
import { AddExpense } from './components/AddExpense'
import { CategoriesPage } from './components/Categories'
import { Settings } from './components/Settings'

export default function App() {
  const [tab, setTab] = useState<TabId>('dashboard')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState('')
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await ensureSeeded()
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const subExp = liveQuery(() =>
      db.expenses.orderBy('date').reverse().toArray(),
    ).subscribe({
      next: (rows) => setExpenses(rows),
      error: () => setExpenses([]),
    })
    const subCat = liveQuery(() =>
      db.categories.orderBy('sortOrder').toArray(),
    ).subscribe({
      next: (rows) => setCategories(rows),
      error: () => setCategories([]),
    })
    return () => {
      subExp.unsubscribe()
      subCat.unsubscribe()
    }
  }, [ready])

  const refreshToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }, [])

  const goImport = () => {
    setTab('settings')
    setTimeout(() => importInputRef.current?.click(), 100)
  }

  if (!ready) {
    return (
      <div className="app-shell">
        <div className="app-content" style={{ textAlign: 'center', paddingTop: 80 }}>
          Загрузка…
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <main className="app-content">
        {tab === 'dashboard' && (
          <Dashboard
            expenses={expenses}
            categories={categories}
            onAdd={() => setTab('add')}
            onImport={goImport}
          />
        )}
        {tab === 'history' && (
          <History
            expenses={expenses}
            categories={categories}
            onAdd={() => setTab('add')}
            onImport={goImport}
            onChanged={() => undefined}
          />
        )}
        {tab === 'add' && (
          <AddExpense
            categories={categories}
            onSaved={() => {
              refreshToast('Расход сохранён')
              setTab('dashboard')
            }}
          />
        )}
        {tab === 'categories' && (
          <CategoriesPage
            categories={categories}
            onChanged={() => undefined}
          />
        )}
        {tab === 'settings' && (
          <Settings
            fileInputRef={importInputRef}
            onChanged={() => undefined}
            onImported={() => {
              setTab('dashboard')
            }}
          />
        )}
      </main>
      <BottomNav active={tab} onChange={setTab} />
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
