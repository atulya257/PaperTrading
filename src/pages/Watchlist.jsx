import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import StockTable from '../components/markets/StockTable.jsx'
import ChangeBadge from '../components/stock/ChangeBadge.jsx'
import WatchButton from '../components/stock/WatchButton.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { ACCOUNT_LIMITS } from '../config/constants.js'
import { useMarketSnapshot, useStocks } from '../hooks/useMarketData.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { sortStocks, toggleSort } from '../utils/search.js'
import { formatINR } from '../utils/format.js'
import './Watchlist.css'

const SUGGESTIONS = 5

export default function Watchlist() {
  usePageTitle('Watchlist')
  const { account, toggleWatchlist } = useAccount()
  const stocks = useStocks()
  const { quotes } = useMarketSnapshot()
  const [sort, setSort] = useState({ key: null, dir: 'desc' })

  const bySymbol = useMemo(() => new Map(stocks.map((s) => [s.symbol, s])), [stocks])
  const watched = useMemo(() => account.watchlist.map((sym) => bySymbol.get(sym)).filter(Boolean), [account.watchlist, bySymbol])
  const rows = sort.key ? sortStocks(watched, quotes, sort) : watched

  const addable = useMemo(
    () => stocks.filter((s) => !account.watchlist.includes(s.symbol)).sort((a, b) => a.symbol.localeCompare(b.symbol)),
    [stocks, account.watchlist],
  )
  const popular = useMemo(() => [...addable].sort((a, b) => b.marketCap - a.marketCap).slice(0, SUGGESTIONS), [addable])
  const full = account.watchlist.length >= ACCOUNT_LIMITS.WATCHLIST_MAX

  const moves = watched.reduce(
    (acc, s) => {
      const q = quotes[s.symbol]
      if (q && q.change > 0) acc.up += 1
      else if (q && q.change < 0) acc.down += 1
      return acc
    },
    { up: 0, down: 0 },
  )

  return (
    <div className="watchlist">
      <header className="page-head watch-head">
        <div>
          <h1>Watchlist</h1>
          <p className="page-sub">
            {watched.length === 0
              ? 'Track stocks you are interested in.'
              : `${watched.length} ${watched.length === 1 ? 'stock' : 'stocks'} · ${moves.up} up · ${moves.down} down today`}
          </p>
        </div>

        {!full && addable.length > 0 && (
          <label className="watch-add">
            <span className="sr-only">Add a stock to your watchlist</span>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) toggleWatchlist(e.target.value)
              }}
            >
              <option value="">Add a stock…</option>
              {addable.map((s) => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} — {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {full && <p className="watch-full">Your watchlist is full ({ACCOUNT_LIMITS.WATCHLIST_MAX} stocks). Remove one to add another.</p>}

      {watched.length === 0 ? (
        <Card>
          <EmptyState
            icon={Star}
            title="Your watchlist is empty"
            action={
              <Button to="/markets" variant="secondary">
                Browse markets
              </Button>
            }
          >
            Tap the star next to any stock to keep an eye on it here.
          </EmptyState>
          <div className="suggest">
            <p className="suggest-title">Popular stocks</p>
            <ul className="suggest-list">
              {popular.map((s) => {
                const q = quotes[s.symbol]
                return (
                  <li key={s.symbol} className="suggest-item">
                    <Link to={`/stock/${encodeURIComponent(s.symbol)}`} className="suggest-link">
                      <span className="suggest-symbol">{s.symbol}</span>
                      <span className="suggest-name">{s.name}</span>
                      {q && (
                        <span className="suggest-quote">
                          <span className="num">{formatINR(q.price)}</span>
                          <ChangeBadge pct={q.changePct} />
                        </span>
                      )}
                    </Link>
                    <WatchButton symbol={s.symbol} />
                  </li>
                )
              })}
            </ul>
          </div>
        </Card>
      ) : (
        <StockTable stocks={rows} sort={sort} onSort={(key) => setSort((current) => toggleSort(current, key))} />
      )}
      <p className="watch-foot">Demo prices — not real market data. Your watchlist is saved in this browser.</p>
    </div>
  )
}
