import Card from '../ui/Card.jsx'
import DayRange from './DayRange.jsx'
import { formatCompactINR, formatINR } from '../../utils/format.js'
import './StockStats.css'

export default function StockStats({ stock, quote }) {
  const rows = [
    ['Previous close', formatINR(quote.prevClose)],
    ['Day high', formatINR(quote.dayHigh)],
    ['Day low', formatINR(quote.dayLow)],
    ['52-week high', formatINR(quote.high52)],
    ['52-week low', formatINR(quote.low52)],
    ['Market cap', formatCompactINR(stock.marketCap)],
    ['P/E ratio', Number.isFinite(stock.pe) ? stock.pe.toFixed(1) : '—'],
    ['Sector', stock.sector],
  ]
  return (
    <Card title="Key statistics">
      <div className="stats-ranges">
        <DayRange label="Day range" low={quote.dayLow} high={quote.dayHigh} price={quote.price} />
        <DayRange label="52-week range" low={quote.low52} high={quote.high52} price={quote.price} />
      </div>
      <dl className="stats-grid">
        {rows.map(([label, value]) => (
          <div key={label} className="stats-item">
            <dt>{label}</dt>
            <dd className="num">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
