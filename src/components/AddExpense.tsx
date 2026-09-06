import { useMemo, useState } from 'react'
import type { Category } from '../types'
import { addExpense } from '../utils/importExport'
import { toIsoDate } from '../utils/format'
import { AmountKeypad, parseAmountInput } from './AmountKeypad'
import { CategoryChips } from './CategoryChips'

interface Props {
  categories: Category[]
  onSaved: () => void
}

export function AddExpense({ categories, onSaved }: Props) {
  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState(categories[0]?.name || '')
  const [date, setDate] = useState(toIsoDate())
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selected = useMemo(
    () => categories.find((c) => c.name === category),
    [categories, category],
  )

  const save = async () => {
    setError('')
    const amount = parseAmountInput(amountStr)
    if (amount <= 0) {
      setError('Введите положительную сумму')
      return
    }
    if (!category) {
      setError('Выберите категорию')
      return
    }
    setSaving(true)
    try {
      await addExpense({
        amount,
        category,
        group: selected?.group,
        date,
        comment: comment.trim() || undefined,
      })
      setAmountStr('')
      setComment('')
      setDate(toIsoDate())
      onSaved()
    } catch {
      setError('Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="page-title">Новый расход</h1>
      <p className="page-sub">Сумма в рублях</p>

      <div className="card">
        <AmountKeypad value={amountStr} onChange={setAmountStr} />
      </div>

      <p className="section-label">Категория</p>
      <div className="card">
        <CategoryChips
          categories={categories}
          value={category}
          onChange={setCategory}
        />
        {selected?.group && (
          <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
            Группа: {selected.group}
          </p>
        )}
      </div>

      <p className="section-label">Детали</p>
      <div className="card">
        <div className="field">
          <label htmlFor="exp-date">Дата</label>
          <input
            id="exp-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="exp-comment">Комментарий</label>
          <textarea
            id="exp-comment"
            rows={2}
            placeholder="Необязательно"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p style={{ color: 'var(--danger)', marginTop: 12 }} role="alert">
          {error}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving}
          onClick={save}
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}
