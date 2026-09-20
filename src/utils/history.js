export const PORTFOLIO_RANGES = [
  { value: '1H', label: '1H', text: 'last hour' },
  { value: '1D', label: 'Today', text: 'today' },
  { value: 'ALL', label: 'All', text: 'since you started' },
]

const HOUR_MS = 3_600_000

function startOfLocalDay(ms) {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function sliceValueHistory(history, range, now = Date.now()) {
  if (range === 'ALL' || history.length === 0) return history
  const cutoff = range === '1H' ? now - HOUR_MS : startOfLocalDay(now)
  const firstInside = history.findIndex((p) => p.t >= cutoff)
  if (firstInside === 0) return history
  const carried = history[(firstInside === -1 ? history.length : firstInside) - 1]
  const inside = firstInside === -1 ? [] : history.slice(firstInside)
  return [{ t: cutoff, value: carried.value }, ...inside]
}

export function sampleEvenly(items, count) {
  if (items.length <= count || count < 2) return items
  const out = []
  for (let i = 0; i < count; i++) out.push(items[Math.round((i * (items.length - 1)) / (count - 1))])
  return out
}
