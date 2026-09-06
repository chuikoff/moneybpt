interface Props {
  onAdd: () => void
  onImport: () => void
}

export function EmptyState({ onAdd, onImport }: Props) {
  return (
    <div className="empty-state card">
      <div className="emoji">🌿</div>
      <h2>Пока нет расходов</h2>
      <p>
        Добавьте первую трату или импортируйте выгрузку из Money Pro. Все данные
        остаются только на этом устройстве.
      </p>
      <div className="stack-gap">
        <button type="button" className="btn btn-primary" onClick={onAdd}>
          Добавить расход
        </button>
        <button type="button" className="btn btn-secondary" onClick={onImport}>
          Импорт CSV / TSV
        </button>
      </div>
    </div>
  )
}
