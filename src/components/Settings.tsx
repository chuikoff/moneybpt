import { useRef, useState, type RefObject } from 'react'
import type { ImportSummary } from '../types'
import {
  downloadBlob,
  exportCsv,
  exportJson,
  importRows,
  parseImportFile,
  wipeAllData,
} from '../utils/importExport'
import { ensureSeeded } from '../db/database'

interface Props {
  onChanged: () => void
  onImported: () => void
  fileInputRef?: RefObject<HTMLInputElement | null>
}

export function Settings({ onChanged, onImported, fileInputRef }: Props) {
  const localRef = useRef<HTMLInputElement>(null)
  const inputRef = fileInputRef || localRef
  const [summary, setSummary] = useState<ImportSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2800)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setSummary(null)
    try {
      const { rows, errors } = await parseImportFile(file)
      const result = await importRows(rows, errors)
      setSummary(result)
      onImported()
      showToast(`Импортировано: ${result.imported}`)
    } catch (e) {
      setSummary({
        total: 0,
        imported: 0,
        duplicates: 0,
        skipped: 1,
        errors: [e instanceof Error ? e.message : 'Ошибка импорта'],
      })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const doExportJson = async () => {
    const blob = await exportJson()
    downloadBlob(blob, `moneybpt-export-${Date.now()}.json`)
    showToast('JSON скачан')
  }

  const doExportCsv = async () => {
    const blob = await exportCsv()
    downloadBlob(blob, `moneybpt-export-${Date.now()}.tsv`)
    showToast('TSV скачан')
  }

  const doWipe = async () => {
    if (
      !confirm(
        'Удалить ВСЕ расходы и категории с этого устройства? Это нельзя отменить.',
      )
    ) {
      return
    }
    if (!confirm('Точно удалить все данные?')) return
    await wipeAllData()
    await ensureSeeded()
    setSummary(null)
    onChanged()
    showToast('Данные очищены, категории восстановлены')
  }

  return (
    <div>
      <h1 className="page-title">Настройки</h1>
      <p className="page-sub">Данные только на устройстве · без сервера</p>

      <p className="section-label">Импорт</p>
      <div className="card">
        <p className="hint">
          CSV/TSV (UTF-8 или UTF-16). Колонки: Дата, Сумма, Валюта, Счет,
          Статья, Группа статей, Комментарий. Дата в формате ГГГГ.ММ.ДД.
          Повторный импорт пропускает дубликаты.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain,*/*"
          hidden
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Импорт…' : 'Выбрать файл'}
        </button>
        <p className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
          Пример:{' '}
          <a href={`${import.meta.env.BASE_URL}sample-export.tsv`} download>
            sample-export.tsv
          </a>
        </p>
      </div>

      {summary && (
        <div className="summary-box">
          <h3>Итог импорта</h3>
          <ul>
            <li>Строк данных: {summary.total}</li>
            <li>Добавлено: {summary.imported}</li>
            <li>Дубликатов: {summary.duplicates}</li>
            <li>Ошибок разбора: {summary.skipped}</li>
          </ul>
          {summary.errors.length > 0 && (
            <ul style={{ marginTop: 8, color: 'var(--danger)' }}>
              {summary.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="section-label">Экспорт</p>
      <div className="stack-gap">
        <button type="button" className="btn btn-secondary" onClick={doExportJson}>
          Экспорт JSON
        </button>
        <button type="button" className="btn btn-secondary" onClick={doExportCsv}>
          Экспорт TSV
        </button>
      </div>

      <p className="section-label">Данные</p>
      <button type="button" className="btn btn-danger" onClick={doWipe}>
        Удалить все данные
      </button>

      <p className="section-label">О приложении</p>
      <div className="card">
        <p className="hint" style={{ marginBottom: 0 }}>
          MoneyBPT — личный учёт расходов. Все операции хранятся в IndexedDB
          браузера. Нет бэкенда и аналитики. Можно установить как PWA для
          офлайн-работы.
        </p>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
