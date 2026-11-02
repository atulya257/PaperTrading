import { Link } from 'react-router-dom'
import { useMarketSnapshot, useStocks } from '../../hooks/useMarketData.js'
import { formatINR, formatPercent, trendOf } from '../../utils/format.js'
import './TickerTape.css'

const MARK = { gain: '▲', loss: '▼', flat: '■' }

function TickerItem({ symbol, quote, linked }) {
  const trend = trendOf(quote.changePct)
  const body = (
    <>
      <span className="ticker-symbol">{symbol}</span>
      <span className="ticker-price num">{formatINR(quote.price)}</span>
      <span className={`ticker-change num ${trend}`}>
        <span aria-hidden="true">{MARK[trend]} </span>
        {formatPercent(quote.changePct)}
      </span>
    </>
  )
  return linked ? (
    <Link to={`/stock/${symbol}`} className="ticker-item" tabIndex={-1}>
      {body}
    </Link>
  ) : (
    <span className="ticker-item">{body}</span>
  )
}

/** A scrolling strip of every stock's price, like the tape on a trading floor. Pauses when hovered. */
export default function TickerTape({ linked = true }) {
  const { quotes } = useMarketSnapshot()
  const stocks = useStocks()
  const items = stocks.filter((s) => quotes[s.symbol])
  if (items.length === 0) return null

  const row = (copy) => (
    <div className="ticker-row" aria-hidden={copy ? 'true' : undefined}>
      {items.map((s) => (
        <TickerItem key={s.symbol} symbol={s.symbol} quote={quotes[s.symbol]} linked={linked && !copy} />
      ))}
    </div>
  )

  return (
    <div className="ticker" role="region" aria-label="Live prices">
      <div className="ticker-track" style={{ '--ticker-duration': `${items.length * 3.5}s` }}>
        {row(false)}
        {row(true)}
      </div>
    </div>
  )
}
