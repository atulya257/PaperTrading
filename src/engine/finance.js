import { ACCOUNT_LIMITS } from '../config/constants.js'
import { safePercent } from '../utils/money.js'

export const averagePrice = (holding) => (holding.quantity ? Math.round(holding.invested / holding.quantity) : 0)

export const holdingMarketValue = (holding, price) => holding.quantity * price

export function holdingUnrealizedPnl(holding, price) {
  const pnl = holdingMarketValue(holding, price) - holding.invested
  return { pnl, pct: safePercent(pnl, holding.invested) }
}

export function maxAffordableQuantity(cash, price) {
  if (!(price > 0) || !(cash > 0)) return 0
  return Math.min(Math.floor(cash / price), ACCOUNT_LIMITS.MAX_ORDER_QUANTITY)
}

export function valueAtPreviousClose(account, quotes) {
  let value = account.cash
  for (const h of Object.values(account.holdings)) {
    const q = quotes[h.symbol]
    value += h.quantity * (q ? q.prevClose : averagePrice(h))
  }
  return value
}

function allocate(items, total, holdingsTotal) {
  return items
    .filter((i) => i.value > 0)
    .map((i) => ({
      ...i,
      pct: safePercent(i.value, total),
      pctOfHoldings: i.key === 'CASH' ? null : safePercent(i.value, holdingsTotal),
    }))
    .sort((a, b) => b.value - a.value)
}

export function computePortfolio(account, quotes, { sectorOf } = {}) {
  let invested = 0
  let marketValue = 0

  const holdings = Object.values(account.holdings).map((h) => {
    const quote = quotes[h.symbol]
    const priceMissing = !quote
    const price = quote ? quote.price : averagePrice(h)
    const value = holdingMarketValue(h, price)
    const { pnl, pct } = holdingUnrealizedPnl(h, price)
    invested += h.invested
    marketValue += value
    return {
      symbol: h.symbol,
      quantity: h.quantity,
      invested: h.invested,
      averagePrice: averagePrice(h),
      price,
      marketValue: value,
      unrealizedPnl: pnl,
      unrealizedPnlPct: pct,
      dayChangePct: quote ? quote.changePct : 0,
      priceMissing,
      openedAt: h.openedAt,
    }
  })

  const totalValue = account.cash + marketValue
  holdings.forEach((h) => (h.weightPct = safePercent(h.marketValue, totalValue)))
  holdings.sort((a, b) => b.marketValue - a.marketValue)

  const unrealizedPnl = marketValue - invested
  const totalReturn = totalValue - account.initialCapital
  const dayPnl = totalValue - account.dayOpenValue

  const cashItem = { key: 'CASH', label: 'Cash', value: account.cash }
  const byHolding = allocate(
    [cashItem, ...holdings.map((h) => ({ key: h.symbol, label: h.symbol, value: h.marketValue }))],
    totalValue,
    marketValue,
  )

  const sectorTotals = {}
  if (sectorOf) {
    for (const h of holdings) {
      const sector = sectorOf(h.symbol) ?? 'Other'
      sectorTotals[sector] = (sectorTotals[sector] ?? 0) + h.marketValue
    }
  }
  const bySector = allocate(
    [cashItem, ...Object.entries(sectorTotals).map(([label, value]) => ({ key: label, label, value }))],
    totalValue,
    marketValue,
  )

  return {
    holdings,
    holdingsCount: holdings.length,
    cash: account.cash,
    invested,
    marketValue,
    unrealizedPnl,
    unrealizedPnlPct: safePercent(unrealizedPnl, invested),
    realizedPnl: account.realizedPnl,
    totalValue,
    totalReturn,
    totalReturnPct: safePercent(totalReturn, account.initialCapital),
    dayPnl,
    dayPnlPct: safePercent(dayPnl, account.dayOpenValue),
    allocation: { byHolding, bySector },
    hasMissingPrices: holdings.some((h) => h.priceMissing),
  }
}

export function isConsistent(account) {
  const invested = Object.values(account.holdings).reduce((sum, h) => sum + h.invested, 0)
  return account.cash + invested === account.initialCapital + account.realizedPnl
}

export function foldAllocation(items, max = 8) {
  if (items.length <= max) return items
  const keep = items.filter((i) => i.key === 'CASH')
  const others = items.filter((i) => i.key !== 'CASH')
  const shown = others.slice(0, max - keep.length - 1)
  const tail = others.slice(max - keep.length - 1)
  const other = {
    key: 'OTHER',
    label: `Other (${tail.length})`,
    value: tail.reduce((sum, i) => sum + i.value, 0),
    pct: tail.reduce((sum, i) => sum + i.pct, 0),
    pctOfHoldings: tail.reduce((sum, i) => sum + (i.pctOfHoldings ?? 0), 0),
  }
  return [...[...keep, ...shown].sort((a, b) => b.value - a.value), other]
}

export function portfolioInsights(portfolio) {
  let best = null
  let worst = null
  for (const h of portfolio.holdings) {
    if (h.priceMissing) continue
    if (h.dayChangePct > 0 && (!best || h.dayChangePct > best.dayChangePct)) best = h
    if (h.dayChangePct < 0 && (!worst || h.dayChangePct < worst.dayChangePct)) worst = h
  }
  const cash = portfolio.allocation.byHolding.find((i) => i.key === 'CASH')
  return { best, worst, cashPct: cash ? cash.pct : 0 }
}

export function summarizeOrders(orders) {
  let buys = 0
  let sells = 0
  let buyValue = 0
  let sellValue = 0
  let realizedPnl = 0
  let wins = 0
  let losses = 0
  for (const o of orders) {
    if (o.side === 'BUY') {
      buys += 1
      buyValue += o.total
    } else {
      sells += 1
      sellValue += o.total
      realizedPnl += o.realizedPnl ?? 0
      if (o.realizedPnl > 0) wins += 1
      else if (o.realizedPnl < 0) losses += 1
    }
  }
  return { count: orders.length, buys, sells, buyValue, sellValue, realizedPnl, wins, losses, winRatePct: safePercent(wins, wins + losses) }
}
