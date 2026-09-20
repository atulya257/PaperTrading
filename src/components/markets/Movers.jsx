import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Card from '../ui/Card.jsx'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import { useMarketSnapshot, useStocks } from '../../hooks/useMarketData.js'
import { formatINR } from '../../utils/format.js'
import './Movers.css'

const COUNT = 3

function MoverList({ title, rows }) {
  return (
    <Card title={title} className="movers-card">
      <ul className="movers-list">
        {rows.map((q) => (
          <li key={q.symbol}>
            <Link to={`/stock/${encodeURIComponent(q.symbol)}`} className="mover">
              <span className="mover-symbol">{q.symbol}</span>
              <span className="mover-price num">{formatINR(q.price)}</span>
              <ChangeBadge pct={q.changePct} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function Movers() {
  const { quotes } = useMarketSnapshot()
  const stocks = useStocks()
  const { gainers, losers } = useMemo(() => {
    const all = stocks.map((s) => quotes[s.symbol]).filter(Boolean)
    const sorted = [...all].sort((a, b) => b.changePct - a.changePct)
    return { gainers: sorted.slice(0, COUNT), losers: sorted.slice(-COUNT).reverse() }
  }, [stocks, quotes])

  return (
    <div className="movers">
      <MoverList title="Top gainers" rows={gainers} />
      <MoverList title="Top losers" rows={losers} />
    </div>
  )
}
