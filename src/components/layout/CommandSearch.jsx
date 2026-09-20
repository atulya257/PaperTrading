import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import Dialog from '../ui/Dialog.jsx'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { useMarketSnapshot, useStocks } from '../../hooks/useMarketData.js'
import { searchStocks } from '../../utils/search.js'
import { formatINR } from '../../utils/format.js'
import './CommandSearch.css'

const TRENDING_COUNT = 5

export default function CommandSearch({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} title="Search stocks" placement="top" bare>
      <SearchPanel onClose={onClose} />
    </Dialog>
  )
}

function SearchPanel({ onClose }) {
  const navigate = useNavigate()
  const stocks = useStocks()
  const { quotes } = useMarketSnapshot()
  const { account } = useAccount()
  const listId = useId()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const groups = useMemo(() => {
    if (query.trim()) return [{ title: null, items: searchStocks(stocks, query) }]
    const bySymbol = new Map(stocks.map((s) => [s.symbol, s]))
    const recent = account.recentlyViewed.map((sym) => bySymbol.get(sym)).filter(Boolean)
    const recentSet = new Set(recent.map((s) => s.symbol))
    const trending = stocks
      .filter((s) => !recentSet.has(s.symbol) && quotes[s.symbol])
      .sort((a, b) => Math.abs(quotes[b.symbol].changePct) - Math.abs(quotes[a.symbol].changePct))
      .slice(0, TRENDING_COUNT)
    return [
      ...(recent.length ? [{ title: 'Recently viewed', items: recent }] : []),
      { title: 'Biggest movers today', items: trending },
    ]
  }, [query, stocks, quotes, account.recentlyViewed])

  const flat = groups.flatMap((g) => g.items)
  const activeIndex = Math.min(active, Math.max(0, flat.length - 1))

  function open(stock) {
    onClose()
    navigate(`/stock/${encodeURIComponent(stock.symbol)}`)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (flat.length === 0) return
      const delta = e.key === 'ArrowDown' ? 1 : -1
      setActive((activeIndex + delta + flat.length) % flat.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flat[activeIndex]) open(flat[activeIndex])
    }
  }

  let counter = -1
  return (
    <div className="palette">
      <div className="palette-input-row">
        <Search size={20} aria-hidden="true" className="palette-icon" />
        <input
          data-autofocus
          className="palette-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={flat.length ? `${listId}-${activeIndex}` : undefined}
          aria-label="Search stocks by name, symbol or sector"
          placeholder="Search stocks by name, symbol or sector"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
        />
        <kbd className="palette-kbd">Esc</kbd>
      </div>

      <p className="sr-only" role="status">
        {query.trim() ? (flat.length ? `${flat.length} ${flat.length === 1 ? 'stock' : 'stocks'} found` : 'No stocks found') : ''}
      </p>

      <div className="palette-results" id={listId} role="listbox" aria-label="Stocks">
        {query.trim() && flat.length === 0 && <p className="palette-empty">No stocks match “{query.trim()}”.</p>}
        {groups.map((group) =>
          group.items.length === 0 ? null : (
            <div key={group.title ?? 'results'} role="presentation">
              {group.title && <p className="palette-group">{group.title}</p>}
              {group.items.map((stock) => {
                const index = ++counter
                const quote = quotes[stock.symbol]
                return (
                  <div
                    key={stock.symbol}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`palette-option${index === activeIndex ? ' active' : ''}`}
                    onMouseMove={() => setActive(index)}
                    onClick={() => open(stock)}
                  >
                    <div className="palette-name">
                      <span className="palette-symbol">{stock.symbol}</span>
                      <span className="palette-company">
                        {stock.name} · {stock.sector}
                      </span>
                    </div>
                    {quote && (
                      <div className="palette-quote">
                        <span className="num">{formatINR(quote.price)}</span>
                        <ChangeBadge pct={quote.changePct} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ),
        )}
      </div>

      <p className="palette-foot">
        <span>↑ ↓ to move</span>
        <span>Enter to open</span>
        <span>Simulated prices</span>
      </p>
    </div>
  )
}
