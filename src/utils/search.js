const norm = (s) => String(s ?? '').trim().toLowerCase()

function score(stock, q) {
  const symbol = stock.symbol.toLowerCase()
  const name = stock.name.toLowerCase()
  if (symbol === q) return 100
  if (symbol.startsWith(q)) return 80
  if (name.startsWith(q)) return 70
  if (name.split(/[\s&.,-]+/).some((word) => word.startsWith(q))) return 60
  if (symbol.includes(q)) return 50
  if (name.includes(q)) return 40
  if (stock.sector.toLowerCase().includes(q)) return 20
  return 0
}

export function searchStocks(stocks, query, limit = 8) {
  const q = norm(query)
  if (!q) return []
  return stocks
    .map((stock) => ({ stock, score: score(stock, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.stock.symbol.localeCompare(b.stock.symbol))
    .slice(0, limit)
    .map((r) => r.stock)
}

export function filterStocks(stocks, { query = '', sector = 'All' } = {}) {
  const q = norm(query)
  return stocks.filter((s) => {
    if (sector !== 'All' && s.sector !== sector) return false
    if (!q) return true
    return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  })
}

const SORT_VALUE = {
  name: (s) => s.symbol,
  price: (s, q) => q?.price ?? 0,
  change: (s, q) => q?.changePct ?? 0,
  marketCap: (s) => s.marketCap,
}
export const SORT_KEYS = Object.keys(SORT_VALUE)

export function sortStocks(stocks, quotes, { key = 'marketCap', dir = 'desc' } = {}) {
  const value = SORT_VALUE[key] ?? SORT_VALUE.marketCap
  const sign = dir === 'asc' ? 1 : -1
  return [...stocks].sort((a, b) => {
    const va = value(a, quotes[a.symbol])
    const vb = value(b, quotes[b.symbol])
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb
    return sign * cmp || a.symbol.localeCompare(b.symbol)
  })
}

const FIRST_DIRECTION = { name: 'asc', price: 'desc', change: 'desc', marketCap: 'desc' }

export function toggleSort(current, key, firstDirection = FIRST_DIRECTION) {
  if (current.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
  return { key, dir: firstDirection[key] ?? 'desc' }
}
