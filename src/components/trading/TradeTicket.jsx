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
import { SIDE, previewOrder } from '../../engine/trading.js'
import { parseQuantity } from '../../utils/parse.js'
import { formatINR, formatQuantity, formatSignedINR, trendOf } from '../../utils/format.js'
import './TradeTicket.css'

const CONFIRM_TIMEOUT_MS = 10_000
const SIDE_OPTIONS = [
  { value: SIDE.BUY, label: 'Buy', tone: 'gain' },
  { value: SIDE.SELL, label: 'Sell', tone: 'loss' },
]

const share = (base, fraction) => (base > 0 ? Math.min(base, Math.max(1, Math.floor(base * fraction))) : 0)

export default function TradeTicket({ symbol, initialSide = SIDE.BUY, onExecuted }) {
  const quote = useQuote(symbol)
  const { account, placeOrder } = useAccount()
  const toast = useToast()
  const inputId = useId()
  const hintId = `${inputId}-hint`

  const [side, setSide] = useState(initialSide)
  const [text, setText] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (!confirming) return undefined
    const timer = setTimeout(() => setConfirming(false), CONFIRM_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [confirming])

  const held = account.holdings[symbol]?.quantity ?? 0
  const maxBuy = maxAffordableQuantity(account.cash, quote.price)
  const quantity = parseQuantity(text)
  const preview = quantity === null ? null : previewOrder(account, { symbol, side, quantity }, quote)
  const isBuy = side === SIDE.BUY
  const verb = isBuy ? 'Buy' : 'Sell'
  const canReview = preview?.ok === true

  function edit(nextText) {
    setText(nextText)
    setConfirming(false)
    setSubmitError(null)
  }
  function changeSide(next) {
    setSide(next)
    setConfirming(false)
    setSubmitError(null)
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
    const result = await placeOrder({ symbol, side, quantity })
    setSubmitting(false)
    setConfirming(false)
    if (result.ok) {
      const { order } = result
      const detail =
        order.realizedPnl === null
          ? `${formatQuantity(order.quantity)} × ${formatINR(order.price)} = ${formatINR(order.total)}`
          : `${formatQuantity(order.quantity)} × ${formatINR(order.price)} = ${formatINR(order.total)} · P&L ${formatSignedINR(order.realizedPnl)}`
      toast.success(`${isBuy ? 'Bought' : 'Sold'} ${formatQuantity(order.quantity)} ${symbol}`, detail)
      setText('')
      onExecuted?.(order)
    } else {
      setSubmitError(result.error.message)
    }
  }

  const chips = isBuy
    ? [
        { label: '25%', value: share(maxBuy, 0.25) },
        { label: '50%', value: share(maxBuy, 0.5) },
        { label: 'Max', value: maxBuy },
      ]
    : [
        { label: '25%', value: share(held, 0.25) },
        { label: '50%', value: share(held, 0.5) },
        { label: 'All', value: held },
      ]

  const pnlTrend = preview?.ok && preview.realizedPnl !== null ? trendOf(preview.realizedPnl) : 'flat'

  return (
    <form className="ticket" onSubmit={submit} noValidate>
      <SegmentedControl label="Order side" options={SIDE_OPTIONS} value={side} onChange={changeSide} size="lg" />

      <div className="ticket-price-row">
        <span className="ticket-label">Simulated price</span>
        <span className="ticket-price">
          <LivePrice paise={quote.price} />
        </span>
      </div>

      <div className="ticket-qty">
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
          {isBuy
            ? `Whole shares only · you can afford up to ${formatQuantity(maxBuy)}`
            : held > 0
              ? `Whole shares only · you hold ${formatQuantity(held)}`
              : `Whole shares only · you do not hold ${symbol}`}
        </p>
      </div>

      <dl className="ticket-summary">
        <div>
          <dt>Estimated total</dt>
          <dd className="num strong">{preview?.total != null ? formatINR(preview.total) : '—'}</dd>
        </div>
        <div>
          <dt>Cash available</dt>
          <dd className="num">{formatINR(account.cash)}</dd>
        </div>
        {preview?.ok && (
          <>
            <div>
              <dt>Cash after order</dt>
              <dd className="num">{formatINR(preview.cashAfter)}</dd>
            </div>
            {!isBuy && (
              <div>
                <dt>Profit / loss on this sale</dt>
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
        {confirming && preview?.ok
          ? `Confirm ${verb.toUpperCase()} ${formatQuantity(quantity)} · ≈${formatINR(preview.total)}`
          : `Review ${verb.toLowerCase()} order`}
      </Button>
      {confirming ? (
        <button type="button" className="ticket-cancel" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      ) : null}

      <p className="ticket-foot">
        Fills instantly at the simulated price when you confirm. Demo only — no real money.{' '}
        <Link to="/orders">View orders</Link>
      </p>
    </form>
  )
}
