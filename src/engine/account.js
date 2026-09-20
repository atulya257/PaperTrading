import { ACCOUNT_LIMITS, INITIAL_CAPITAL } from '../config/constants.js'
import { isInteger } from '../utils/money.js'

export function createAccount({ userId, now, sessionDate, initialCapital = INITIAL_CAPITAL }) {
  return {
    userId,
    createdAt: now,
    initialCapital,
    cash: initialCapital,
    holdings: {},
    orders: [],
    realizedPnl: 0,
    watchlist: [],
    recentlyViewed: [],
    dayOpenValue: initialCapital,
    dayOpenDate: sessionDate,
    valueHistory: [{ t: now, value: initialCapital }],
  }
}

export const isWatched = (account, symbol) => account.watchlist.includes(symbol)

export function toggleWatchlist(account, symbol) {
  if (isWatched(account, symbol)) {
    return { ...account, watchlist: account.watchlist.filter((s) => s !== symbol) }
  }
  if (account.watchlist.length >= ACCOUNT_LIMITS.WATCHLIST_MAX) return account
  return { ...account, watchlist: [...account.watchlist, symbol] }
}

export function markViewed(account, symbol) {
  if (account.recentlyViewed[0] === symbol) return account
  const rest = account.recentlyViewed.filter((s) => s !== symbol)
  return { ...account, recentlyViewed: [symbol, ...rest].slice(0, ACCOUNT_LIMITS.RECENT_MAX) }
}

export function recordValueSnapshot(account, t, value) {
  const history = account.valueHistory
  const last = history[history.length - 1]
  if (last && t < last.t) return account
  let next = last && last.t === t ? [...history.slice(0, -1), { t, value }] : [...history, { t, value }]
  if (next.length > ACCOUNT_LIMITS.VALUE_HISTORY_MAX) {
    const lastIndex = next.length - 1
    next = next.filter((_, i) => i === 0 || i === lastIndex || i % 2 === 0)
  }
  return { ...account, valueHistory: next }
}

export const needsNewSession = (account, sessionDate) => account.dayOpenDate !== sessionDate

export function startSession(account, { sessionDate, dayOpenValue }) {
  return { ...account, dayOpenDate: sessionDate, dayOpenValue }
}

const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x)
const isString = (x) => typeof x === 'string' && x.length > 0

function sanitizeOrder(o) {
  if (!isObject(o)) return null
  const ok =
    isString(o.id) &&
    isString(o.symbol) &&
    (o.side === 'BUY' || o.side === 'SELL') &&
    isInteger(o.quantity) && o.quantity > 0 &&
    isInteger(o.price) && o.price > 0 &&
    isInteger(o.total) &&
    (o.realizedPnl === null || isInteger(o.realizedPnl)) &&
    Number.isFinite(o.createdAt)
  if (!ok) return null
  return {
    id: o.id,
    symbol: o.symbol,
    side: o.side,
    quantity: o.quantity,
    price: o.price,
    total: o.total,
    realizedPnl: o.realizedPnl,
    status: 'EXECUTED',
    createdAt: o.createdAt,
  }
}

const uniqueStrings = (list, max) =>
  Array.isArray(list) ? [...new Set(list.filter(isString))].slice(0, max) : []

export function sanitizeAccount(data) {
  if (!isObject(data)) return null
  if (!isString(data.userId)) return null
  if (!isInteger(data.cash) || data.cash < 0) return null
  if (!isInteger(data.initialCapital) || data.initialCapital <= 0) return null
  if (!isInteger(data.realizedPnl)) return null
  if (!isObject(data.holdings)) return null

  const holdings = {}
  for (const [symbol, h] of Object.entries(data.holdings)) {
    const ok =
      isObject(h) && h.symbol === symbol && isInteger(h.quantity) && h.quantity > 0 && isInteger(h.invested) && h.invested >= 0
    if (!ok) return null
    holdings[symbol] = {
      symbol,
      quantity: h.quantity,
      invested: h.invested,
      openedAt: Number.isFinite(h.openedAt) ? h.openedAt : 0,
    }
  }

  const orders = (Array.isArray(data.orders) ? data.orders : [])
    .map(sanitizeOrder)
    .filter(Boolean)
    .slice(0, ACCOUNT_LIMITS.ORDERS_MAX)

  let valueHistory = (Array.isArray(data.valueHistory) ? data.valueHistory : []).filter(
    (p) => isObject(p) && Number.isFinite(p.t) && isInteger(p.value),
  )
  valueHistory = valueHistory
    .map((p) => ({ t: p.t, value: p.value }))
    .sort((a, b) => a.t - b.t)
    .slice(-ACCOUNT_LIMITS.VALUE_HISTORY_MAX)

  const investedTotal = Object.values(holdings).reduce((sum, h) => sum + h.invested, 0)
  const hasSession = isInteger(data.dayOpenValue) && isString(data.dayOpenDate)

  return {
    userId: data.userId,
    createdAt: Number.isFinite(data.createdAt) ? data.createdAt : 0,
    initialCapital: data.initialCapital,
    cash: data.cash,
    holdings,
    orders,
    realizedPnl: data.realizedPnl,
    watchlist: uniqueStrings(data.watchlist, ACCOUNT_LIMITS.WATCHLIST_MAX),
    recentlyViewed: uniqueStrings(data.recentlyViewed, ACCOUNT_LIMITS.RECENT_MAX),
    dayOpenValue: hasSession ? data.dayOpenValue : data.cash + investedTotal,
    dayOpenDate: hasSession ? data.dayOpenDate : '',
    valueHistory,
  }
}
