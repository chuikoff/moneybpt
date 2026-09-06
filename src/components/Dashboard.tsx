import { useMemo, useState } from 'react'
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

type Tab = 'month' | 'by-month' | 'by-year'

interface PeriodItem {
  key: string
  title: string
  total: number
  count: number
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function monthKeyFromIso(iso: string) {
  return iso.slice(0, 7) // YYYY-MM
}

function yearKeyFromIso(iso: string) {
  return iso.slice(0, 4) // YYYY
}

function labelForMonthKey(key: string) {
  return capitalize(monthLabel(`${key}-01`))
}

function rangeForMonthKey(key: string): { from: string; to: string } {
  const [y, m] = key.split('-').map(Number)
  const from = `${key}-01`
  const last = new Date(y, m, 0)
  const to = `${y}-${String(m).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
  return { from, to }
}

function rangeForYearKey(key: string): { from: string; to: string } {
  return { from: `${key}-01-01`, to: `${key}-12-31` }
}

export function Dashboard({ expenses, categories, onAdd, onImport }: Props) {
  const [tab, setTab] = useState<Tab>('month')
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(null)

  const current = currentMonthRange()
  const currentMonthKey = current.from.slice(0, 7)
  const currentYearKey = String(new Date().getFullYear())

  const colorMap = useMemo(() => {
    const m = new Map<string, string>()
    categories.forEach((c) => m.set(c.name, c.color || '#2d6a4f'))
    return m
  }, [categories])

  const months = useMemo(() => {
    const map = new Map<string, PeriodItem>()
    for (const e of expenses) {
      const key = monthKeyFromIso(e.date)
      const item = map.get(key)
      if (item) {
        item.total += e.amount
        item.count += 1
      } else {
        map.set(key, {
          key,
          title: labelForMonthKey(key),
          total: e.amount,
          count: 1,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key))
  }, [expenses])

  const years = useMemo(() => {
    const map = new Map<string, PeriodItem>()
    for (const e of expenses) {
      const key = yearKeyFromIso(e.date)
      const item = map.get(key)
      if (item) {
        item.total += e.amount
        item.count += 1
      } else {
        map.set(key, {
          key,
          title: key,
          total: e.amount,
          count: 1,
        })
      }
    }
    return [...map.values()].sort((a, b) => b.key.localeCompare(a.key))
  }, [expenses])

  const activeMonthKey =
    selectedMonth && months.some((m) => m.key === selectedMonth)
      ? selectedMonth
      : months[0]?.key || currentMonthKey

  const activeYearKey =
    selectedYear && years.some((y) => y.key === selectedYear)
      ? selectedYear
      : years[0]?.key || currentYearKey

  const periodRange = useMemo(() => {
    if (tab === 'month') return current
    if (tab === 'by-month') return rangeForMonthKey(activeMonthKey)
    return rangeForYearKey(activeYearKey)
  }, [tab, current, activeMonthKey, activeYearKey])

  const periodExpenses = useMemo(
    () =>
      expenses.filter(
        (e) => e.date >= periodRange.from && e.date <= periodRange.to,
      ),
    [expenses, periodRange],
  )

  const total = useMemo(
    () => periodExpenses.reduce((s, e) => s + e.amount, 0),
    [periodExpenses],
  )

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of periodExpenses) {
      map.set(e.category, (map.get(e.category) || 0) + e.amount)
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
  }, [periodExpenses])

  const maxCat = byCategory[0]?.[1] || 1
  const recent = expenses.slice(0, 8)

  const periodSubtitle =
    tab === 'month'
      ? capitalize(monthLabel())
      : tab === 'by-month'
        ? labelForMonthKey(activeMonthKey)
        : activeYearKey

  const totalLabel =
    tab === 'by-year' ? 'Всего за год' : 'Всего за месяц'

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
      <p className="page-sub">{periodSubtitle}</p>

      <div className="seg-tabs" role="tablist" aria-label="Период">
        <button
          type="button"
          role="tab"
          className={`seg-tab${tab === 'month' ? ' active' : ''}`}
          aria-selected={tab === 'month'}
          onClick={() => setTab('month')}
        >
          Месяц
        </button>
        <button
          type="button"
          role="tab"
          className={`seg-tab${tab === 'by-month' ? ' active' : ''}`}
          aria-selected={tab === 'by-month'}
          onClick={() => setTab('by-month')}
        >
          По месяцам
        </button>
        <button
          type="button"
          role="tab"
          className={`seg-tab${tab === 'by-year' ? ' active' : ''}`}
          aria-selected={tab === 'by-year'}
          onClick={() => setTab('by-year')}
        >
          По годам
        </button>
      </div>

      <div className="card">
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {totalLabel}
        </div>
        <div className="stat-big">{formatMoney(total)}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {periodExpenses.length} операций
        </div>
      </div>

      {tab === 'by-month' && months.length > 0 && (
        <>
          <p className="section-label">Месяцы</p>
          <div className="card period-list">
            {months.map((m) => (
              <button
                type="button"
                key={m.key}
                className={`period-row${m.key === activeMonthKey ? ' active' : ''}`}
                onClick={() => setSelectedMonth(m.key)}
              >
                <div>
                  <div className="period-title">{m.title}</div>
                  <div className="period-meta">{m.count} операций</div>
                </div>
                <div className="period-sum">{formatMoney(m.total)}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'by-year' && years.length > 0 && (
        <>
          <p className="section-label">Годы</p>
          <div className="card period-list">
            {years.map((y) => (
              <button
                type="button"
                key={y.key}
                className={`period-row${y.key === activeYearKey ? ' active' : ''}`}
                onClick={() => setSelectedYear(y.key)}
              >
                <div>
                  <div className="period-title">{y.title}</div>
                  <div className="period-meta">{y.count} операций</div>
                </div>
                <div className="period-sum">{formatMoney(y.total)}</div>
              </button>
            ))}
          </div>
        </>
      )}

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

      {tab === 'month' && (
        <>
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
        </>
      )}
    </div>
  )
}
