import { useState } from 'react'
import type { Category } from '../types'
import { db } from '../db/database'

interface Props {
  categories: Category[]
  onChanged: () => void
}

const GROUPS = ['', 'Коммуналка', 'Авто', 'Дети']

export function CategoriesPage({ categories, onChanged }: Props) {
  const [name, setName] = useState('')
  const [group, setGroup] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)

  const saveNew = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const exists = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase(),
    )
    if (exists) {
      alert('Такая категория уже есть')
      return
    }
    const maxSort =
      categories.reduce((m, c) => Math.max(m, c.sortOrder), -1) + 1
    await db.categories.add({
      name: trimmed,
      group: group || undefined,
      sortOrder: maxSort,
      color: '#52b788',
    })
    setName('')
    setGroup('')
    onChanged()
  }

  const saveEdit = async () => {
    if (!editing?.id) return
    const trimmed = editing.name.trim()
    if (!trimmed) return
    await db.categories.update(editing.id, {
      name: trimmed,
      group: editing.group || undefined,
    })
    setEditing(null)
    onChanged()
  }

  const remove = async (c: Category) => {
    if (!c.id) return
    if (!confirm(`Удалить категорию «${c.name}»?`)) return
    await db.categories.delete(c.id)
    onChanged()
  }

  return (
    <div>
      <h1 className="page-title">Категории</h1>
      <p className="page-sub">{categories.length} статей</p>

      <div className="card">
        <div className="field">
          <label htmlFor="cat-name">Новая категория</label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
          />
        </div>
        <div className="field">
          <label htmlFor="cat-group">Группа</label>
          <select
            id="cat-group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="">Без группы</option>
            {GROUPS.filter(Boolean).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={saveNew}>
          Добавить
        </button>
      </div>

      <p className="section-label">Список</p>
      {categories.map((c) => (
        <div className="cat-item" key={c.id ?? c.name}>
          <span
            className="tx-dot"
            style={{ background: c.color || '#2d6a4f' }}
          />
          <div className="name">
            {c.name}
            {c.group && <div className="group-tag">{c.group}</div>}
          </div>
          <div className="cat-actions">
            <button type="button" onClick={() => setEditing({ ...c })}>
              Изм.
            </button>
            <button type="button" onClick={() => remove(c)}>
              Удал.
            </button>
          </div>
        </div>
      ))}

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Редактировать</h3>
            <div className="field">
              <label>Название</label>
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </div>
            <div className="field">
              <label>Группа</label>
              <select
                value={editing.group || ''}
                onChange={(e) =>
                  setEditing({ ...editing, group: e.target.value || undefined })
                }
              >
                <option value="">Без группы</option>
                {GROUPS.filter(Boolean).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="stack-gap">
              <button type="button" className="btn btn-primary" onClick={saveEdit}>
                Сохранить
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditing(null)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
