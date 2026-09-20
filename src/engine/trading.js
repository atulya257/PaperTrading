import { ACCOUNT_LIMITS } from '../config/constants.js'
import { formatINR } from '../utils/format.js'
import { mulDivRound } from '../utils/money.js'
import { averagePrice } from './finance.js'

export const SIDE = { BUY: 'BUY', SELL: 'SELL' }

export const ORDER_ERRORS = {
  INVALID_SIDE: 'INVALID_SIDE',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  UNKNOWN_SYMBOL: 'UNKNOWN_SYMBOL',
  NO_QUOTE: 'NO_QUOTE',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INSUFFICIENT_SHARES: 'INSUFFICIENT_SHARES',
}

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

function makeOrder({ id, now }, symbol, side, quantity, price, total, realizedPnl) {
  return { id, symbol, side, quantity, price, total, realizedPnl, status: 'EXECUTED', createdAt: now }
}

function withOrder(account, order) {
  return [order, ...account.orders].slice(0, ACCOUNT_LIMITS.ORDERS_MAX)
}

function executeBuy(account, symbol, quantity, price, total, meta) {
  if (account.cash < total) {
    return fail(
      ORDER_ERRORS.INSUFFICIENT_FUNDS,
      `Insufficient funds: this order costs ${formatINR(total)} but you have ${formatINR(account.cash)} available.`,
      { required: total, available: account.cash },
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
  if (quantity > heldQuantity) {
    return fail(
      ORDER_ERRORS.INSUFFICIENT_SHARES,
      heldQuantity === 0
        ? `You do not own any shares of ${symbol}.`
        : `Insufficient shares: you are selling ${quantity} but only hold ${heldQuantity} of ${symbol}.`,
      { requested: quantity, held: heldQuantity },
    )
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
