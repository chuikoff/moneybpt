/** Simple non-crypto hash for dedupe keys (stable, fast). */
export async function dedupeHash(
  date: string,
  amount: number,
  category: string,
  group: string,
  comment: string,
): Promise<string> {
  const raw = `${date}|${amount}|${category}|${group}|${comment}`
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(raw)
    const buf = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // Fallback FNV-1a
  let h = 2166136261
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}
