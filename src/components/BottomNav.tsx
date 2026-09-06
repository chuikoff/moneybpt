import type { TabId } from '../types'

const TABS: Array<{ id: TabId; label: string; icon: string; fab?: boolean }> = [
  { id: 'dashboard', label: 'Обзор', icon: '◈' },
  { id: 'history', label: 'История', icon: '☰' },
  { id: 'add', label: 'Добавить', icon: '+', fab: true },
  { id: 'categories', label: 'Статьи', icon: '◇' },
  { id: 'settings', label: 'Ещё', icon: '⚙' },
]

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav" aria-label="Навигация">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${active === tab.id ? 'active' : ''} ${tab.fab ? 'nav-add' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.fab ? (
            <span className="nav-fab">{tab.icon}</span>
          ) : (
            <>
              <span className="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </>
          )}
        </button>
      ))}
    </nav>
  )
}
