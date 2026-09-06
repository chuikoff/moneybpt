interface Props {
  value: string
  onChange: (v: string) => void
}

export function AmountKeypad({ value, onChange }: Props) {
  const press = (key: string) => {
    if (key === '⌫') {
      onChange(value.slice(0, -1) || '')
      return
    }
    if (key === ',') {
      if (value.includes(',') || value.includes('.')) return
      onChange((value || '0') + ',')
      return
    }
    if (key === 'C') {
      onChange('')
      return
    }
    if (value.replace(',', '.').includes('.')) {
      const dec = value.split(/[,.]/)[1] || ''
      if (dec.length >= 2) return
    }
    if (value === '0') {
      onChange(key)
      return
    }
    onChange(value + key)
  }

  const display = value || '0'
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']

  return (
    <div>
      <div className="amount-display" aria-live="polite">
        {display}&nbsp;₽
      </div>
      <div className="keypad">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            className={k === '⌫' || k === ',' ? 'key-action' : ''}
            onClick={() => press(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={() => press('C')}>
        Очистить
      </button>
    </div>
  )
}

export function parseAmountInput(value: string): number {
  if (!value) return 0
  const n = Number(value.replace(',', '.').replace(/\s/g, ''))
  return Number.isFinite(n) ? n : 0
}
