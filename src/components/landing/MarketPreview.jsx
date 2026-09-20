import { useMemo } from 'react'
import { useMarketSnapshot, useStocks } from '../../hooks/useMarketData.js'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import { formatINR } from '../../utils/format.js'
import './MarketPreview.css'

const ROWS = 5

export default function MarketPreview() {
  const { quotes, index, moodLabel } = useMarketSnapshot()
  const stocks = useStocks()

  const movers = useMemo(
    () =>
      stocks
        .map((s) => quotes[s.symbol])
        .filter(Boolean)
        .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
        .slice(0, ROWS),
    [stocks, quotes],
  )
  const nameOf = useMemo(() => new Map(stocks.map((s) => [s.symbol, s.name])), [stocks])

  return (
    <section className="preview" aria-label="Simulated market preview">
      <header className="preview-head">
        <div>
          <p className="preview-eyebrow">TradeLab Index</p>
          <p className="preview-index num">{index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="preview-side">
          <ChangeBadge pct={index.changePct} />
          <span className="preview-mood">Mood: {moodLabel}</span>
        </div>
      </header>

      <ul className="preview-list">
        {movers.map((q) => (
          <li key={q.symbol} className="preview-row">
            <div className="preview-name">
              <span className="preview-symbol">{q.symbol}</span>
              <span className="preview-company">{nameOf.get(q.symbol)}</span>
            </div>
            <span className="preview-price num">{formatINR(q.price)}</span>
            <ChangeBadge pct={q.changePct} />
          </li>
        ))}
      </ul>

    </section>
  )
}
