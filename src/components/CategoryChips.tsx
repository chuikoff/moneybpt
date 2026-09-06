import type { Category } from '../types'

interface Props {
  categories: Category[]
  value: string
  onChange: (name: string) => void
}

export function CategoryChips({ categories, value, onChange }: Props) {
  return (
    <div className="chips" role="listbox" aria-label="Категории">
      {categories.map((c) => (
        <button
          key={c.id ?? c.name}
          type="button"
          role="option"
          aria-selected={value === c.name}
          className={`chip ${value === c.name ? 'active' : ''}`}
          onClick={() => onChange(c.name)}
          style={
            value === c.name && c.color
              ? { borderColor: c.color, color: c.color }
              : undefined
          }
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}
