import { db } from '../db/database'
import type { Expense, ImportSummary } from '../types'
import { dedupeHash } from './hash'
import { fromDotDate, toDotDate, toIsoDate } from './format'

function decodeFileBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  // UTF-16 LE BOM: FF FE
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes)
  }
  // UTF-16 BE BOM: FE FF
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes)
  }
  // UTF-8 BOM: EF BB BF
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xef &&
    bytes[1] === 0xbb &&
    bytes[2] === 0xbf
  ) {
    return new TextDecoder('utf-8').decode(bytes.subarray(3))
  }
  // Heuristic: lots of nulls → likely UTF-16 LE without reliable BOM detection
  let nulls = 0
  const sample = Math.min(bytes.length, 200)
  for (let i = 0; i < sample; i++) if (bytes[i] === 0) nulls++
  if (nulls > sample * 0.2) {
    return new TextDecoder('utf-16le').decode(bytes)
  }
  return new TextDecoder('utf-8').decode(bytes)
}

function detectDelimiter(headerLine: string): '\t' | ',' {
  const tabs = (headerLine.match(/\t/g) || []).length
  const commas = (headerLine.match(/,/g) || []).length
  return tabs >= commas ? '\t' : ','
}

function cleanCell(raw: string): string {
  let s = raw.replace(/\uFEFF/g, '').trim()
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).replace(/""/g, '"')
  }
  return s.replace(/\uFEFF/g, '').trim()
}

function splitLine(line: string, delim: '\t' | ','): string[] {
  // Quote-aware split for both tab and comma (Money Pro quotes every field)
  const result: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delim && !inQuotes) {
      result.push(cleanCell(cur))
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cleanCell(cur))
  return result
}

function parseAmount(raw: string): number | null {
  if (!raw) return null
  let s = raw.replace(/\s/g, '').replace(/₽|RUB|руб\.?/gi, '')
  // Russian decimal: 1 234,56 or 1234,56
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = Number(s)
  if (Number.isNaN(n)) return null
  return Math.abs(n)
}

const COL_MAP: Record<string, string> = {
  дата: 'date',
  сумма: 'amount',
  валюта: 'currency',
  счет: 'account',
  счёт: 'account',
  статья: 'category',
  'группа статей': 'group',
  комментарий: 'comment',
}

export async function parseImportFile(file: File): Promise<{
  rows: Array<{
    date: string
    amount: number
    currency: string
    account: string
    category: string
    group: string
    comment: string
  }>
  errors: string[]
}> {
  const buf = await file.arrayBuffer()
  const text = decodeFileBuffer(buf)
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0)

  const errors: string[] = []
  if (lines.length < 2) {
    return { rows: [], errors: ['Файл пуст или нет данных'] }
  }

  const delim = detectDelimiter(lines[0])
  const headers = splitLine(lines[0], delim).map((h) =>
    h.replace(/\uFEFF/g, '').trim().toLowerCase(),
  )
  const idx: Record<string, number> = {}
  headers.forEach((h, i) => {
    const key = COL_MAP[h]
    if (key) idx[key] = i
  })

  if (idx.date === undefined || idx.amount === undefined || idx.category === undefined) {
    errors.push(
      'Не найдены обязательные колонки: Дата, Сумма, Статья. Заголовок: ' +
        headers.join(' | '),
    )
    return { rows: [], errors }
  }

  const rows: Array<{
    date: string
    amount: number
    currency: string
    account: string
    category: string
    group: string
    comment: string
  }> = []

  for (let li = 1; li < lines.length; li++) {
    const cols = splitLine(lines[li], delim)
    const rawDate = cols[idx.date] ?? ''
    const iso = fromDotDate(rawDate)
    if (!iso) {
      errors.push(`Строка ${li + 1}: неверная дата «${rawDate}»`)
      continue
    }
    const amount = parseAmount(cols[idx.amount] ?? '')
    if (amount === null || amount === 0) {
      errors.push(`Строка ${li + 1}: неверная сумма`)
      continue
    }
    let currency = (idx.currency !== undefined ? cols[idx.currency] : '') || ''
    currency = currency.trim() || 'RUB'
    const account = idx.account !== undefined ? cols[idx.account] || '' : ''
    const category = (cols[idx.category] || '').trim()
    if (!category) {
      errors.push(`Строка ${li + 1}: пустая статья`)
      continue
    }
    const group = idx.group !== undefined ? (cols[idx.group] || '').trim() : ''
    const comment =
      idx.comment !== undefined ? (cols[idx.comment] || '').trim() : ''

    rows.push({ date: iso, amount, currency, account, category, group, comment })
  }

  return { rows, errors }
}

export async function importRows(
  rows: Array<{
    date: string
    amount: number
    currency: string
    account: string
    category: string
    group: string
    comment: string
  }>,
  parseErrors: string[] = [],
): Promise<ImportSummary> {
  let imported = 0
  let duplicates = 0
  const errors = [...parseErrors]

  const existingHashes = new Set(
    (await db.expenses.toArray()).map((e) => e.dedupeHash),
  )
  const categoryNames = new Set((await db.categories.toArray()).map((c) => c.name))
  let maxSort = (await db.categories.orderBy('sortOrder').last())?.sortOrder ?? 0

  const toAdd: Expense[] = []

  for (const row of rows) {
    const hash = await dedupeHash(
      row.date,
      row.amount,
      row.category,
      row.group,
      row.comment,
    )
    if (existingHashes.has(hash)) {
      duplicates++
      continue
    }
    existingHashes.add(hash)

    if (!categoryNames.has(row.category)) {
      maxSort++
      await db.categories.add({
        name: row.category,
        group: row.group || undefined,
        sortOrder: maxSort,
        color: '#74c69d',
      })
      categoryNames.add(row.category)
    }

    toAdd.push({
      amount: row.amount,
      category: row.category,
      group: row.group || undefined,
      date: row.date,
      comment: row.comment || undefined,
      currency: row.currency || 'RUB',
      account: row.account || undefined,
      dedupeHash: hash,
      createdAt: Date.now(),
    })
    imported++
  }

  if (toAdd.length) {
    await db.expenses.bulkAdd(toAdd)
  }

  return {
    total: rows.length,
    imported,
    duplicates,
    skipped: errors.length,
    errors: errors.slice(0, 20),
  }
}

export async function exportJson(): Promise<Blob> {
  const expenses = await db.expenses.orderBy('date').reverse().toArray()
  const categories = await db.categories.orderBy('sortOrder').toArray()
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    expenses,
  }
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
}

export async function exportCsv(): Promise<Blob> {
  const expenses = await db.expenses.orderBy('date').reverse().toArray()
  const header = [
    'Дата',
    'Сумма',
    'Валюта',
    'Счет',
    'Статья',
    'Группа статей',
    'Комментарий',
  ].join('\t')
  const lines = expenses.map((e) =>
    [
      toDotDate(e.date),
      String(-Math.abs(e.amount)),
      e.currency || 'RUB',
      e.account || '',
      e.category,
      e.group || '',
      e.comment || '',
    ].join('\t'),
  )
  const text = '\uFEFF' + [header, ...lines].join('\n')
  return new Blob([text], { type: 'text/tab-separated-values;charset=utf-8' })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function wipeAllData(): Promise<void> {
  await db.transaction('rw', db.expenses, db.categories, db.meta, async () => {
    await db.expenses.clear()
    await db.categories.clear()
    await db.meta.clear()
  })
}

export async function addExpense(input: {
  amount: number
  category: string
  group?: string
  date: string
  comment?: string
}): Promise<void> {
  const hash = await dedupeHash(
    input.date,
    input.amount,
    input.category,
    input.group || '',
    input.comment || '',
  )
  await db.expenses.add({
    amount: input.amount,
    category: input.category,
    group: input.group,
    date: input.date || toIsoDate(),
    comment: input.comment,
    currency: 'RUB',
    dedupeHash: hash,
    createdAt: Date.now(),
  })
}
