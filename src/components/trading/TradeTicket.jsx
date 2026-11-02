import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { Minus, Plus } from 'lucide-react'
import Button from '../ui/Button.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import LivePrice from '../stock/LivePrice.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useQuote } from '../../hooks/useMarketData.js'
import { maxAffordableQuantity } from '../../engine/finance.js'
import { ORDER_TYPE, SIDE, freeCash, freeShares, limitReached, previewOrder } from '../../engine/trading.js'
import { parsePrice, parseQuantity } from '../../utils/parse.js'
import { formatINR, formatQuantity, formatSignedINR, trendOf } from '../../utils/format.js'
import './TradeTicket.css'

const CONFIRM_TIMEOUT_MS = 10_000
const SIDE_OPTIONS = [
  { value: SIDE.BUY, label: 'Buy', tone: 'gain' },
  { value: SIDE.SELL, label: 'Sell', tone: 'loss' },
]
const TYPE_OPTIONS = [
  { value: ORDER_TYPE.MARKET, label: 'Market' },
  { value: ORDER_TYPE.LIMIT, label: 'Limit' },
]

const share = (base, fraction) => (base > 0 ? Math.min(base, Math.max(1, Math.floor(base * fraction))) : 0)

function limitHint(side, limitPrice, price) {
  const isBuy = side === SIDE.BUY
  if (limitReached({ side, limitPrice }, price)) {
    return `The price is already at or ${isBuy ? 'below' : 'above'} this, so it fills on the next price update.`
  }
  return isBuy
    ? `Buys automatically when the price falls to ${formatINR(limitPrice)} or lower.`
    : `Sells automatically when the price rises to ${formatINR(limitPrice)} or higher.`
}

export default function TradeTicket({ symbol, initialSide = SIDE.BUY, onExecuted }) {
  const quote = useQuote(symbol)
  const { account, placeOrder, placeLimit } = useAccount()
  const toast = useToast()
  const inputId = useId()
  const hintId = `${inputId}-hint`
  const priceId = `${inputId}-price`
  const priceHintId = `${inputId}-price-hint`

  const [side, setSide] = useState(initialSide)
  const [type, setType] = useState(ORDER_TYPE.MARKET)
  const [text, setText] = useState('')
  const [priceText, setPriceText] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (!confirming) return undefined
    const timer = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [confirming])

  const isBuy = side === SIDE.BUY
  const isLimit = type === ORDER_TYPE.LIMIT
  const verb = isBuy ? 'Buy' : 'Sell'
  const direction = isBuy ? 'lower' : 'higher'

  const held = account.holdings[symbol]?.quantity ?? 0
  const sellable = freeShares(account, symbol)
  const available = freeCash(account)
  const limitPrice = isLimit ? parsePrice(priceText) : null
  // A limit order is checked as if it filled at the limit price.
  const orderQuote = isLimit ? (limitPrice === null ? null : { ...quote, price: limitPrice }) : quote
  const maxBuy = maxAffordableQuantity(available, orderQuote?.price ?? quote.price)
  const quantity = parseQuantity(text)
  const preview = quantity === null || !orderQuote ? null : previewOrder(account, { symbol, side, quantity }, orderQuote)
  const canReview = preview?.ok === true

  function reset() {
    setConfirming(false)
    setSubmitError(null)
  }
  function edit(nextText) {
    setText(nextText)
    reset()
  }
  function changeSide(next) {
    setSide(next)
    reset()
  }
  function changeType(next) {
    setType(next)
    if (next === ORDER_TYPE.LIMIT && priceText === '') setPriceText((quote.price / 100).toFixed(2))
    reset()
  }
  function editPrice(nextText) {
    setPriceText(nextText.replace(/[^\d.,]/g, '').slice(0, 12))
    reset()
  }
  function step(delta) {
    edit(String(Math.max(1, (quantity ?? 0) + delta)))
  }

  async function submit(e) {
    e.preventDefault()
    if (submitting || quantity === null) return
    if (!confirming) {
      if (canReview) setConfirming(true)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const result = isLimit
      ? await placeLimit({ symbol, side, quantity, limitPrice })
      : await placeOrder({ symbol, side, quantity })
    setSubmitting(false)
    setConfirming(false)
    if (!result.ok) {
      setSubmitError(result.error.message)
      return
    }
    const { order } = result
    if (isLimit) {
      const when = limitReached(order, quote.price)
        ? 'The price is already there, so it fills on the next price update.'
        : 'It fills automatically when the price gets there.'
      toast.success(
        `${verb} order placed`,
        `${formatQuantity(order.quantity)} ${symbol} at ${formatINR(order.limitPrice)} or ${direction}. ${when}`,
      )
    } else {
      const detail =
        order.realizedPnl === null
          ? `${formatQuantity(order.quantity)} × ${formatINR(order.price)} = ${formatINR(order.total)}`
          : `${formatQuantity(order.quantity)} × ${formatINR(order.price)} = ${formatINR(order.total)}, profit ${formatSignedINR(order.realizedPnl)}`
      toast.success(`${isBuy ? 'Bought' : 'Sold'} ${formatQuantity(order.quantity)} ${symbol}`, detail)
    }
    setText('')
    onExecuted?.(order)
  }

  const chips = isBuy
    ? [
        { label: '25%', value: share(maxBuy, 0.25) },
        { label: '50%', value: share(maxBuy, 0.5) },
        { label: 'Max', value: maxBuy },
      ]
    : [
        { label: '25%', value: share(sellable, 0.25) },
        { label: '50%', value: share(sellable, 0.5) },
        { label: 'All', value: sellable },
      ]

  let quantityHint
  if (isBuy) quantityHint = `You can afford up to ${formatQuantity(maxBuy)} shares${isLimit ? ' at this price' : ''}.`
  else if (held === 0) quantityHint = `You don't own any ${symbol} yet.`
  else if (sellable < held)
    quantityHint = `You hold ${formatQuantity(held)} shares. ${formatQuantity(held - sellable)} are already in open sell orders.`
  else quantityHint = `You hold ${formatQuantity(held)} shares.`

  const pnlTrend = preview?.ok && preview.realizedPnl !== null ? trendOf(preview.realizedPnl) : 'flat'

  let buttonLabel = `Review ${verb.toLowerCase()} order`
  if (confirming && preview?.ok) {
    buttonLabel = isLimit
      ? `Confirm: ${verb.toLowerCase()} ${formatQuantity(quantity)} at ${formatINR(limitPrice)} or ${direction}`
      : `Confirm: ${verb.toLowerCase()} ${formatQuantity(quantity)} for about ${formatINR(preview.total)}`
  }

  return (
    <form className="ticket" onSubmit={submit} noValidate>
      <SegmentedControl label="Order side" options={SIDE_OPTIONS} value={side} onChange={changeSide} size="lg" />
      <SegmentedControl
        label="Order type"
        options={TYPE_OPTIONS}
        value={type}
        onChange={changeType}
        className="ticket-type"
      />

      <div className="ticket-price-row">
        <span className="ticket-label">Simulated price</span>
        <span className="ticket-price">
          <LivePrice paise={quote.price} />
        </span>
      </div>

      {isLimit && (
        <div className="ticket-field">
          <label htmlFor={priceId} className="ticket-label">
            Limit price
          </label>
          <div className="ticket-money">
            <span aria-hidden="true">₹</span>
            <input
              id={priceId}
              className="ticket-input num"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={priceText}
              onChange={(e) => editPrice(e.target.value)}
              aria-describedby={priceHintId}
              aria-invalid={priceText !== '' && limitPrice === null ? true : undefined}
            />
          </div>
          <p id={priceHintId} className="ticket-hint">
            {limitPrice === null ? 'Enter a price such as 2800 or 2800.50.' : limitHint(side, limitPrice, quote.price)}
          </p>
        </div>
      )}

      <div className="ticket-field">
        <label htmlFor={inputId} className="ticket-label">
          Quantity
        </label>
        <div className="ticket-stepper">
          <button type="button" className="step-btn" onClick={() => step(-1)} aria-label="Decrease quantity" disabled={!quantity || quantity <= 1}>
            <Minus size={18} aria-hidden="true" />
          </button>
          <input
            id={inputId}
            className="ticket-input num"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="0"
            value={text}
            onChange={(e) => edit(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
            aria-describedby={hintId}
            aria-invalid={text !== '' && quantity === null ? true : undefined}
          />
          <button type="button" className="step-btn" onClick={() => step(1)} aria-label="Increase quantity">
            <Plus size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="ticket-chips" role="group" aria-label="Quick quantity">
          {chips.map((c) => (
            <button key={c.label} type="button" className="chip" disabled={c.value < 1} onClick={() => edit(String(c.value))}>
              {c.label}
            </button>
          ))}
        </div>
        <p id={hintId} className="ticket-hint">
          {quantityHint}
        </p>
      </div>

      <dl className="ticket-summary">
        <div>
          <dt>{isLimit ? 'Total at your price' : 'Estimated total'}</dt>
          <dd className="num strong">{preview?.total != null ? formatINR(preview.total) : '—'}</dd>
        </div>
        <div>
          <dt>Cash available</dt>
          <dd className="num">{formatINR(available)}</dd>
        </div>
        {preview?.ok && (
          <>
            <div>
              <dt>{isLimit ? 'Cash after it fills' : 'Cash after order'}</dt>
              <dd className="num">{formatINR(preview.cashAfter)}</dd>
            </div>
            {!isBuy && (
              <div>
                <dt>{isLimit ? 'Profit / loss at your price' : 'Profit / loss on this sale'}</dt>
                <dd className={`num strong ${pnlTrend}`}>{formatSignedINR(preview.realizedPnl)}</dd>
              </div>
            )}
            <div>
              <dt>Position after</dt>
              <dd className="num">
                {preview.quantityAfter > 0
                  ? `${formatQuantity(preview.quantityAfter)} @ ${formatINR(preview.averagePriceAfter)}`
                  : 'Closed'}
              </dd>
            </div>
          </>
        )}
      </dl>

      {preview && !preview.ok && (
        <p className="ticket-problem" role="status">
          {preview.error.message}
        </p>
      )}
      {submitError && (
        <p className="ticket-problem" role="alert">
          {submitError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        block
        variant={isBuy ? 'gain' : 'loss'}
        loading={submitting}
        disabled={!canReview && !confirming}
      >
        {buttonLabel}
      </Button>
      {confirming ? (
        <button type="button" className="ticket-cancel" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      ) : null}

      <p className="ticket-foot">
        {isLimit
          ? 'A limit order waits until the price reaches yours, then fills by itself. The cash or shares it needs are set aside until then.'
          : 'Orders fill straight away at the simulated price. No real money is used.'}{' '}
        <Link to="/orders">View orders</Link>
      </p>
    </form>
  )
}
