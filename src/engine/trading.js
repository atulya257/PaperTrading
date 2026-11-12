import { ACCOUNT_LIMITS } from '../config/constants.js'
import { formatINR } from '../utils/format.js'
import { mulDivRound } from '../utils/money.js'
import { averagePrice } from './finance.js'

export const SIDE = { BUY: 'BUY', SELL: 'SELL' }
export const ORDER_TYPE = { MARKET: 'MARKET', LIMIT: 'LIMIT' }

export const ORDER_ERRORS = {
  INVALID_SIDE: 'INVALID_SIDE',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  UNKNOWN_SYMBOL: 'UNKNOWN_SYMBOL',
  NO_QUOTE: 'NO_QUOTE',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_SHARES: 'INSUFFICIENT_SHARES',
  INVALID_PRICE: 'INVALID_PRICE',
  TOO_MANY_OPEN_ORDERS: 'TOO_MANY_OPEN_ORDERS',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
}

/** Cash set aside for open buy orders, valued at their limit prices. */
export function reservedCash(account) {
  return (account.openOrders ?? []).reduce((sum, o) => (o.side === SIDE.BUY ? sum + o.quantity * o.limitPrice : sum), 0)
}

export const freeCash = (account) => account.cash - reservedCash(account)

/** Shares of a stock already promised to open sell orders. */
export function reservedShares(account, symbol) {
  return (account.openOrders ?? []).reduce(
    (sum, o) => (o.side === SIDE.SELL && o.symbol === symbol ? sum + o.quantity : sum),
    0,
  )
}

export const freeShares = (account, symbol) => (account.holdings[symbol]?.quantity ?? 0) - reservedShares(account, symbol)

const fail = (code, message, details) => ({ ok: false, error: { code, message, ...(details ? { details } : {}) } })

function checkRequest(request, quote) {
  const { symbol, side, quantity } = request ?? {}
  if (side !== SIDE.BUY && side !== SIDE.SELL) return fail(ORDER_ERRORS.INVALID_SIDE, 'Order must be a buy or a sell.')
  if (typeof symbol !== 'string' || !symbol) return fail(ORDER_ERRORS.UNKNOWN_SYMBOL, 'Choose a stock to trade.')
  if (!Number.isInteger(quantity) || quantity < 1) {
    return fail(ORDER_ERRORS.INVALID_QUANTITY, 'Quantity must be a whole number of at least 1.')
  }
  if (quantity > ACCOUNT_LIMITS.MAX_ORDER_QUANTITY) {
    return fail(
      ORDER_ERRORS.INVALID_QUANTITY,
      `Quantity is too large. The maximum per order is ${ACCOUNT_LIMITS.MAX_ORDER_QUANTITY.toLocaleString('en-IN')} shares.`,
    )
  }
  if (!quote || quote.symbol !== symbol) return fail(ORDER_ERRORS.UNKNOWN_SYMBOL, `No price is available for ${symbol}.`)
  if (quote.state === 'stale' || quote.state === 'error' || !Number.isSafeInteger(quote.price) || quote.price <= 0) {
    return fail(ORDER_ERRORS.NO_QUOTE, `The price for ${symbol} is not available right now. Try again in a moment.`)
  }
  return null
}

export function executeOrder(account, request, quote, meta) {
  const invalid = checkRequest(request, quote)
  if (invalid) return invalid

  const { symbol, side, quantity } = request
  const price = quote.price
  const total = quantity * price
  if (!Number.isSafeInteger(total)) return fail(ORDER_ERRORS.INVALID_QUANTITY, 'This order is too large.')

  return side === SIDE.BUY
    ? executeBuy(account, symbol, quantity, price, total, meta)
    : executeSell(account, symbol, quantity, price, total, meta)
}

function makeOrder({ id, now, limitPrice = null }, symbol, side, quantity, price, total, realizedPnl) {
  return {
    id,
    symbol,
    side,
    type: limitPrice === null ? ORDER_TYPE.MARKET : ORDER_TYPE.LIMIT,
    limitPrice,
    quantity,
    price,
    total,
    realizedPnl,
    status: 'EXECUTED',
    createdAt: now,
  }
}

function withOrder(account, order) {
  return [order, ...account.orders].slice(0, ACCOUNT_LIMITS.ORDERS_MAX)
}

function executeBuy(account, symbol, quantity, price, total, meta) {
  const reserved = reservedCash(account)
  const available = account.cash - reserved
  if (available < total) {
    const setAside = reserved > 0 ? ` ${formatINR(reserved)} is set aside for your open buy orders.` : ''
    return fail(
      ORDER_ERRORS.INSUFFICIENT_FUNDS,
      `Insufficient funds: this order costs ${formatINR(total)} but you have ${formatINR(available)} available.${setAside}`,
      { required: total, available },
    )
  }

  const existing = account.holdings[symbol]
  const holding = existing
    ? { ...existing, quantity: existing.quantity + quantity, invested: existing.invested + total }
    : { symbol, quantity, invested: total, openedAt: meta.now }

  const order = makeOrder(meta, symbol, SIDE.BUY, quantity, price, total, null)
  return {
    ok: true,
    order,
    account: {
      ...account,
      cash: account.cash - total,
      holdings: { ...account.holdings, [symbol]: holding },
      orders: withOrder(account, order),
    },
  }
}

function executeSell(account, symbol, quantity, price, total, meta) {
  const held = account.holdings[symbol]
  const heldQuantity = held ? held.quantity : 0
  const promised = reservedShares(account, symbol)
  if (quantity > heldQuantity - promised) {
    let message
    if (heldQuantity === 0) message = `You do not own any shares of ${symbol}.`
    else if (promised > 0)
      message = `Insufficient shares: you hold ${heldQuantity} of ${symbol} but ${promised} are already in open sell orders.`
    else message = `Insufficient shares: you are selling ${quantity} but only hold ${heldQuantity} of ${symbol}.`
    return fail(ORDER_ERRORS.INSUFFICIENT_SHARES, message, { requested: quantity, held: heldQuantity })
  }

  const isFullSale = quantity === held.quantity
  const costSold = isFullSale ? held.invested : mulDivRound(held.invested, quantity, held.quantity)
  const realizedPnl = total - costSold

  const holdings = { ...account.holdings }
  if (isFullSale) delete holdings[symbol]
  else holdings[symbol] = { ...held, quantity: held.quantity - quantity, invested: held.invested - costSold }

  const order = makeOrder(meta, symbol, SIDE.SELL, quantity, price, total, realizedPnl)
  return {
    ok: true,
    order,
    account: {
      ...account,
      cash: account.cash + total,
      holdings,
      realizedPnl: account.realizedPnl + realizedPnl,
      orders: withOrder(account, order),
    },
  }
}

export function previewOrder(account, request, quote) {
  const result = executeOrder(account, request, quote, { id: 'preview', now: 0 })
  const usable =
    Number.isInteger(request?.quantity) && request.quantity > 0 && quote && Number.isSafeInteger(quote.price)
  const total = usable ? request.quantity * quote.price : null

  if (!result.ok) return { ok: false, error: result.error, total }

  const after = result.account.holdings[request.symbol]
  return {
    ok: true,
    total,
    cashAfter: result.account.cash,
    quantityAfter: after ? after.quantity : 0,
    averagePriceAfter: after ? averagePrice(after) : null,
    realizedPnl: result.order.realizedPnl,
  }
}

/** Has the price reached a limit order's price? Buys wait for the price to fall, sells for it to rise. */
export const limitReached = (order, price) => (order.side === SIDE.BUY ? price <= order.limitPrice : price >= order.limitPrice)

/**
 * Places a limit order: it waits in account.openOrders until the price reaches limitPrice.
 * The cash or shares it needs are set aside straight away so it cannot fail later.
 */
export function placeLimitOrder(account, request, quote, meta) {
  const { limitPrice } = request ?? {}
  if (!Number.isSafeInteger(limitPrice) || limitPrice <= 0) {
    return fail(ORDER_ERRORS.INVALID_PRICE, 'Enter a price above ₹0.')
  }
  if ((account.openOrders ?? []).length >= ACCOUNT_LIMITS.OPEN_ORDERS_MAX) {
    return fail(
      ORDER_ERRORS.TOO_MANY_OPEN_ORDERS,
      `You can have up to ${ACCOUNT_LIMITS.OPEN_ORDERS_MAX} open orders. Cancel one to place another.`,
    )
  }
  // Check cash or shares as if the order filled at the limit price right now.
  const check = executeOrder(account, request, quote && { ...quote, price: limitPrice }, meta)
  if (!check.ok) return check

  const { symbol, side, quantity } = request
  const order = { id: meta.id, symbol, side, quantity, limitPrice, createdAt: meta.now }
  return { ok: true, order, account: { ...account, openOrders: [...(account.openOrders ?? []), order] } }
}

export function cancelLimitOrder(account, id) {
  const openOrders = account.openOrders ?? []
  const order = openOrders.find((o) => o.id === id)
  if (!order) return fail(ORDER_ERRORS.ORDER_NOT_FOUND, 'This order has already filled or been cancelled.')
  return { ok: true, order, account: { ...account, openOrders: openOrders.filter((o) => o.id !== id) } }
}

/**
 * Fills every open order whose limit price has been reached, oldest first, at the current price.
 * Returns the new account plus the orders that filled and any that had to be cancelled.
 */
export function fillLimitOrders(account, quotes, now) {
  let current = account
  const filled = []
  const cancelled = []
  for (const open of account.openOrders ?? []) {
    const quote = quotes[open.symbol]
    if (!quote || quote.state === 'stale' || quote.state === 'error' || !limitReached(open, quote.price)) continue

    // Release this order's reservation, then trade it like a normal order.
    const released = { ...current, openOrders: current.openOrders.filter((o) => o.id !== open.id) }
    const result = executeOrder(released, open, quote, { id: open.id, now, limitPrice: open.limitPrice })
    if (result.ok) {
      current = result.account
      filled.push(result.order)
    } else {
      current = released
      cancelled.push({ order: open, reason: result.error.message })
    }
  }
  return { account: current, filled, cancelled }
}
