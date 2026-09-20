import { formatINR, formatSignedINR, trendOf } from '../../utils/format.js'
import ChangeBadge from './ChangeBadge.jsx'
import LivePrice from './LivePrice.jsx'
import WatchButton from './WatchButton.jsx'
import './QuoteHeader.css'

export default function QuoteHeader({ stock, quote }) {
  const trend = trendOf(quote.change)
  return (
    <header className="quote-header">
      <div className="quote-id">
        <div className="quote-title-row">
          <h1 className="quote-symbol">{stock.symbol}</h1>
          <span className="quote-tag">{stock.exchange}</span>
          <span className="quote-tag">{stock.sector}</span>
          <WatchButton symbol={stock.symbol} />
        </div>
        <p className="quote-name">{stock.name}</p>
      </div>

      <div className="quote-price-block">
        <p className="quote-price">
          <LivePrice paise={quote.price} />
        </p>
        <p className={`quote-change ${trend} num`}>
          <span>{formatSignedINR(quote.change)}</span>
          <ChangeBadge pct={quote.changePct} size={16} />
          <span className="quote-today">today</span>
        </p>
        <p className="quote-meta">
          Simulated · previous close <span className="num">{formatINR(quote.prevClose)}</span>
        </p>
      </div>
    </header>
  )
}
