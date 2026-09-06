import { useMemo } from 'react'
import type { Category, Expense } from '../types'
import {
  currentMonthRange,
  formatMoney,
  formatDayHeader,
  monthLabel,
} from '../utils/format'
import { EmptyState } from './EmptyState'

interface Props {
  expenses: Expense[]
  categories: Category[]
  onAdd: () => void
  onImport: () => void
}

export function Dashboard({ expenses, categories, onAdd, onImport }: Props) {
  const { from, to } = currentMonthRange()
  const colorMap = useMemo(() => {
    const m = new Map<string, string>()
    categories.forEach((c) => m.set(c.name, c.color || '#2d6a4f'))
    return m
  }, [categories])

  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date >= from && e.date <= to),
    [expenses, from, to],
  )

  const total = useMemo(
    () => monthExpenses.reduce((s, e) => s + e.amount, 0),
    [monthExpenses],
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of monthExpenses) {
      map.set(e.category, (map.get(e.category) || 0) + e.amount)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [monthExpenses])

  const maxCat = byCategory[0]?.[1] || 1
  const recent = expenses.slice(0, 8)

  if (expenses.length === 0) {
    return (
      <div>
        <h1 className="page-title">Обзор</h1>
        <p className="page-sub">Личные расходы · ₽</p>
        <EmptyState onAdd={onAdd} onImport={onImport} />
      </div>
    )
  }

  return (
    <div>
      <h1 className="page-title">Обзор</h1>
      <p className="page-sub">{monthLabel()}</p>

      <div className="card">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Всего за месяц
        </div>
        <div className="stat-big">{formatMoney(total)}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {monthExpenses.length} операций
        </div>
      </div>

      {byCategory.length > 0 && (
        <>
          <p className="section-label">По категориям</p>
          <div className="card">
            {byCategory.map(([name, sum]) => (
              <div className="bar-row" key={name}>
                <div className="bar-label" title={name}>
                  {name}
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.max(4, (sum / maxCat) * 100)}%`,
                      background: colorMap.get(name) || '#2d6a4f',
                    }}
                  />
                </div>
                <div className="bar-value">{formatMoney(sum)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="section-label">Недавние</p>
      {recent.map((e) => (
        <div className="tx-row" key={e.id}>
          <span
            className="tx-dot"
            style={{ background: colorMap.get(e.category) || '#2d6a4f' }}
          />
          <div className="tx-body">
            <div className="tx-cat">{e.category}</div>
            <div className="tx-meta">
              {formatDayHeader(e.date)}
              {e.comment ? ` · ${e.comment}` : ''}
            </div>
          </div>
          <div className="tx-amount">{formatMoney(e.amount)}</div>
        </div>
      ))}
    </div>
  )
}
