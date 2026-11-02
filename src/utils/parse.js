export function parseQuantity(text) {
  const t = String(text ?? '').trim()
  return /^\d{1,7}$/.test(t) ? Number(t) : null
}

/** Parses a rupee amount such as "2800" or "2,800.50" into paise. */
export function parsePrice(text) {
  const t = String(text ?? '').trim().replace(/,/g, '')
  if (!/^\d{1,7}(\.\d{0,2})?$/.test(t)) return null
  const paise = Math.round(Number(t) * 100)
  return paise > 0 ? paise : null
}
