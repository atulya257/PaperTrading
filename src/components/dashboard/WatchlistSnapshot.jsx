import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import LivePrice from '../stock/LivePrice.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { useMarketSnapshot, useStocks } from '../../hooks/useMarketData.js'
import './MiniList.css'

const SHOWN = 5

export default function WatchlistSnapshot() {
  const { account } = useAccount()
  const stocks = useStocks()
  const { quotes } = useMarketSnapshot()
  const bySymbol = useMemo(() => new Map(stocks.map((s) => [s.symbol, s])), [stocks])
  const watched = account.watchlist.map((sym) => bySymbol.get(sym)).filter(Boolean)

  return (
    <Card title="Watchlist" actions={<Link to="/watchlist" className="see-all">View all</Link>}>
      {watched.length === 0 ? (
        <EmptyState
          icon={Star}
          title="Nothing on your watchlist"
          action={
            <Button to="/markets" variant="secondary">
              Browse markets
            </Button>
          }
        >
          Tap the star next to a stock to keep an eye on it here.
        </EmptyState>
      ) : (
        <ul className="mini-list">
          {watched.slice(0, SHOWN).map((s) => {
            const q = quotes[s.symbol]
            return (
              <li key={s.symbol}>
                <Link to={`/stock/${encodeURIComponent(s.symbol)}`} className="mini-row">
                  <span className="mini-main">
                    <strong>{s.symbol}</strong>
                    <span className="mini-sub">{s.name}</span>
                  </span>
                  {q && (
                    <span className="mini-right">
                      <LivePrice paise={q.price} />
                      <ChangeBadge pct={q.changePct} />
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {watched.length > SHOWN && <p className="mini-more">+ {watched.length - SHOWN} more on your watchlist</p>}
    </Card>
  )
}
