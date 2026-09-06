import { useMemo, useState } from 'react'
import type { Category, Expense } from '../types'
import { formatDayHeader, formatMoney } from '../utils/format'
import { EmptyState } from './EmptyState'
import { db } from '../db/database'

interface Props {
  expenses: Expense[]
  categories: Category[]
  onAdd: () => void
  onImport: () => void
  onChanged: () => void
}

export function History({
  expenses,
  categories,
  onAdd,
  onImport,
  onChanged,
}: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const colorMap = useMemo(() => {
    const m = new Map<string, string>()
    categories.forEach((c) => m.set(c.name, c.color || '#2d6a4f'))
    return m
  }, [categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return expenses.filter((e) => {
      if (category && e.category !== category) return false
      if (from && e.date < from) return false
      if (to && e.date > to) return false
      if (q) {
        const hay = `${e.category} ${e.group || ''} ${e.comment || ''}`.toLowerCase()
        if (!hay.includes(q) && !String(e.amount).includes(q)) return false
      }
      return true
    })
  }, [expenses, search, category, from, to])

  const groups = useMemo(() => {
    const map = new Map<string, Expense[]>()
    for (const e of filtered) {
      const list = map.get(e.date) || []
      list.push(e)
      map.set(e.date, list)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const remove = async (id?: number) => {
    if (!id) return
    if (!confirm('Удалить эту операцию?')) return
    await db.expenses.delete(id)
    onChanged()
  }

  if (expenses.length === 0) {
    return (
      <div>
        <h1 className="page-title">История</h1>
        <EmptyState onAdd={onAdd} onImport={onImport} />
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">История</h1>
      <p className="page-sub">{filtered.length} из {expenses.length}</p>

      <div className="filters">
        <input
          type="search"
          placeholder="Поиск: категория, комментарий…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            background: 'var(--surface)',
          }}
        />
        <div className="filters-row">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Фильтр по категории"
          >
            <option value="">Все категории</option>
            {categories.map((c) => (
              <option key={c.id ?? c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filters-row">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Дата от"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Дата до"
          />
        </div>
      </div>

      {groups.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          Ничего не найдено
        </div>
      )}

      {groups.map(([date, items]) => {
        const dayTotal = items.reduce((s, e) => s + e.amount, 0)
        return (
          <div className="day-group" key={date}>
            <div className="day-header">
              <h3>{formatDayHeader(date)}</h3>
              <span>{formatMoney(dayTotal)}</span>
            </div>
            {items.map((e) => (
              <div className="tx-row" key={e.id}>
                <span
                  className="tx-dot"
                  style={{ background: colorMap.get(e.category) || '#2d6a4f' }}
                />
                <div className="tx-body">
                  <div className="tx-cat">{e.category}</div>
                  <div className="tx-meta">
                    {e.group ? `${e.group} · ` : ''}
                    {e.comment || 'Без комментария'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="tx-amount">{formatMoney(e.amount)}</div>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '2px 0' }}
                    onClick={() => remove(e.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
