export function parseQuantity(text) {
  const t = String(text ?? '').trim()
  return /^\d{1,7}$/.test(t) ? Number(t) : null
}
