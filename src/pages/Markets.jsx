import { useMemo, useState } from 'react'
import { SearchX } from 'lucide-react'
import MarketPulse from '../components/markets/MarketPulse.jsx'
import Movers from '../components/markets/Movers.jsx'
import StockTable from '../components/markets/StockTable.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { useMarketSnapshot, useStocks } from '../hooks/useMarketData.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { filterStocks, sortStocks, toggleSort } from '../utils/search.js'
import './Markets.css'

const SORT_OPTIONS = [
  { value: 'marketCap:desc', label: 'Market cap (high to low)' },
  { value: 'change:desc', label: 'Change (gainers first)' },
  { value: 'change:asc', label: 'Change (losers first)' },
  { value: 'price:desc', label: 'Price (high to low)' },
  { value: 'price:asc', label: 'Price (low to high)' },
  { value: 'name:asc', label: 'Name (A to Z)' },
]
export default function Markets() {
  usePageTitle('Markets')
  const stocks = useStocks()
  const { quotes } = useMarketSnapshot()
  const [query, setQuery] = useState('')
  const [sector, setSector] = useState('All')
  const [sort, setSort] = useState({ key: 'marketCap', dir: 'desc' })

  const sectors = useMemo(() => ['All', ...[...new Set(stocks.map((s) => s.sector))].sort()], [stocks])
  const visible = sortStocks(filterStocks(stocks, { query, sector }), quotes, sort)

  const onSort = (key) => setSort((current) => toggleSort(current, key))
  function clearFilters() {
    setQuery('')
    setSector('All')
  }

  return (
    <div className="markets">
      <header className="page-head">
        <div>
          <h1>Markets</h1>
          <p className="page-sub">
            {stocks.length} demo stocks · prices are simulated and move while you watch
          </p>
        </div>
      </header>

      <MarketPulse />
      <Movers />

      <section aria-labelledby="all-stocks">
        <h2 id="all-stocks" className="section-heading">
          All stocks
        </h2>

        <div className="toolbar">
          <input
            type="search"
            className="toolbar-search"
            placeholder="Filter by name or symbol"
            aria-label="Filter stocks by name or symbol"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label className="toolbar-sort">
            <span className="sr-only">Sort stocks</span>
            <select value={`${sort.key}:${sort.dir}`} onChange={(e) => { const [key, dir] = e.target.value.split(':'); setSort({ key, dir }) }}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="chips" role="group" aria-label="Filter by sector">
          {sectors.map((s) => (
            <button key={s} type="button" className="sector-chip" aria-pressed={s === sector} onClick={() => setSector(s)}>
              {s}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No stocks match your filters"
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          >
            Try a different name, symbol or sector.
          </EmptyState>
        ) : (
          <StockTable stocks={visible} sort={sort} onSort={onSort} />
        )}
        <p className="markets-foot">Demo prices — not real market data.</p>
      </section>
    </div>
  )
}
