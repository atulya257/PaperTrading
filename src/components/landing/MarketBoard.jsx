import { useMemo } from 'react'
import { useMarketSnapshot, useStocks } from '../../hooks/useMarketData.js'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import { formatINR, formatPercent } from '../../utils/format.js'
import './MarketBoard.css'

/** How strongly to tint a tile: 0 = flat, 1-3 = small to big move. */
function strength(pct) {
  const size = Math.abs(pct)
  if (size >= 1.5) return 3
  if (size >= 0.75) return 2
  if (size > 0) return 1
  return 0
}

/** Every stock as a coloured square, grouped by sector, like the boards on a trading floor. */
export default function MarketBoard() {
  const { quotes, index, moodLabel } = useMarketSnapshot()
  const stocks = useStocks()

  const bySector = useMemo(
    () => [...stocks].sort((a, b) => a.sector.localeCompare(b.sector) || a.symbol.localeCompare(b.symbol)),
    [stocks],
  )

  return (
    <section className="board" aria-label="Today's market">
      <header className="board-head">
        <div>
          <p className="board-label">TradeLab index</p>
          <p className="board-index num">{index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="board-side">
          <ChangeBadge pct={index.changePct} />
          <span className="board-mood">Market mood: {moodLabel}</span>
        </div>
      </header>

      <ul className="board-grid">
        {bySector.map((s) => {
          const q = quotes[s.symbol]
          if (!q) return null
          const tone = q.changePct > 0 ? 'up' : q.changePct < 0 ? 'down' : 'flat'
          return (
            <li
              key={s.symbol}
              className={`board-tile ${tone}-${strength(q.changePct)}`}
              title={`${s.name} (${s.sector})`}
            >
              <span className="board-symbol">{s.symbol}</span>
              <span className="board-price num">{formatINR(q.price)}</span>
              <span className="board-pct num">{formatPercent(q.changePct)}</span>
            </li>
          )
        })}
      </ul>

      <p className="board-note">
        Each square is one stock, grouped by sector. Green is up today and red is down. The deeper the colour, the
        bigger the move.
      </p>
    </section>
  )
}
