import { formatDate, formatINR, formatSignedINR, formatTime, trendOf } from '../../utils/format.js'
import ChangeBadge from './ChangeBadge.jsx'
import LivePrice from './LivePrice.jsx'
import WatchButton from './WatchButton.jsx'
import './QuoteHeader.css'

const scrubTime = (period, t) => (period === '1D' ? formatTime(t) : `${formatDate(t)}${period === '1W' ? `, ${formatTime(t)}` : ''}`)

export default function QuoteHeader({ stock, quote, scrub }) {
  const change = scrub ? scrub.price - scrub.first : quote.change
  const pct = scrub ? (change / scrub.first) * 100 : quote.changePct
  const trend = trendOf(change)

  return (
    <header className="quote-header">
      <div className="quote-title-row">
        <h1 className="quote-symbol">{stock.symbol}</h1>
        <span className="quote-tag">{stock.exchange}</span>
        <span className="quote-tag">{stock.sector}</span>
        <WatchButton symbol={stock.symbol} />
      </div>
      <p className="quote-name">{stock.name}</p>

      <p className={`quote-price${scrub ? ' is-scrubbing' : ''}`}>
        {scrub ? <span className="num">{formatINR(scrub.price)}</span> : <LivePrice paise={quote.price} />}
      </p>
      <p className={`quote-change ${trend} num`}>
        <span>{formatSignedINR(change)}</span>
        <ChangeBadge pct={pct} size={16} />
        <span className="quote-today">{scrub ? `since the start of ${scrub.period}, at ${scrubTime(scrub.period, scrub.t)}` : 'today'}</span>
      </p>
      {!scrub && (
        <p className="quote-meta">
          Previous close <span className="num">{formatINR(quote.prevClose)}</span>
        </p>
      )}
    </header>
  )
}
