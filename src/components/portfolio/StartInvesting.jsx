import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import { useMarketSnapshot, useStocks } from '../../hooks/useMarketData.js'
import { formatINR } from '../../utils/format.js'
import './StartInvesting.css'

const SUGGESTIONS = 4

export default function StartInvesting() {
  const stocks = useStocks()
  const { quotes } = useMarketSnapshot()
  const popular = useMemo(() => [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, SUGGESTIONS), [stocks])

  return (
    <Card>
      <EmptyState
        icon={Briefcase}
        title="You do not hold any stocks yet"
        action={
          <Button to="/markets" size="lg">
            Explore markets
          </Button>
        }
      >
        Your cash is ready. Pick a stock, check its chart and place your first simulated order.
      </EmptyState>
      <div className="popular">
        <p className="popular-title">Large companies to start with</p>
        <ul className="popular-list">
          {popular.map((s) => {
            const q = quotes[s.symbol]
            return (
              <li key={s.symbol}>
                <Link to={`/stock/${encodeURIComponent(s.symbol)}`} className="popular-item">
                  <span className="popular-symbol">{s.symbol}</span>
                  <span className="popular-name">{s.name}</span>
                  {q && (
                    <span className="popular-quote">
                      <span className="num">{formatINR(q.price)}</span>
                      <ChangeBadge pct={q.changePct} />
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}
