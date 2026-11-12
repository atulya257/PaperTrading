import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import ChangeBadge from './ChangeBadge.jsx'
import { useDismiss } from '../../hooks/useDismiss.js'
import { searchStocks } from '../../utils/search.js'
import { formatINR } from '../../utils/format.js'
import './AddStockPicker.css'

export default function AddStockPicker({ stocks, quotes, onAdd }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)
  const listId = useId()

  const results = useMemo(
    () => (query.trim() ? searchStocks(stocks, query, stocks.length) : stocks),
    [stocks, query],
  )
  const activeIndex = Math.min(active, Math.max(0, results.length - 1))

  const dismiss = useCallback(() => {
    setOpen(false)
    setQuery('')
    setActive(0)
  }, [])
  useDismiss(rootRef, open, dismiss)

  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function close() {
    dismiss()
    triggerRef.current?.focus()
  }

  function add(stock) {
    onAdd(stock.symbol)
    setAnnouncement(`${stock.symbol} added to your watchlist`)
    inputRef.current?.focus()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length === 0) return
      const delta = e.key === 'ArrowDown' ? 1 : -1
      setActive((activeIndex + delta + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[activeIndex]) add(results[activeIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  return (
    <div className="picker" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="picker-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <Plus size={18} aria-hidden="true" />
        Add stock
      </button>

      {open && (
        <div className="picker-panel">
          <div className="picker-search">
            <Search size={18} aria-hidden="true" />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={results.length ? `${listId}-${activeIndex}` : undefined}
              aria-label="Find a stock to add"
              placeholder="Find a stock to add"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
            />
          </div>

          <div className="picker-list" id={listId} role="listbox" aria-label="Stocks you can add" ref={listRef}>
            {results.length === 0 && (
              <p className="picker-empty">{query.trim() ? `No stocks match “${query.trim()}”.` : 'Every stock is already on your watchlist.'}</p>
            )}
            {results.map((stock, index) => {
              const quote = quotes[stock.symbol]
              return (
                <div
                  key={stock.symbol}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`picker-option${index === activeIndex ? ' active' : ''}`}
                  onMouseMove={() => setActive(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(stock)}
                >
                  <span className="picker-name">
                    <span className="picker-symbol">{stock.symbol}</span>
                    <span className="picker-company">{stock.name}</span>
                  </span>
                  {quote && (
                    <span className="picker-quote">
                      <span className="num">{formatINR(quote.price)}</span>
                      <ChangeBadge pct={quote.changePct} />
                    </span>
                  )}
                  <span className="picker-add" aria-hidden="true">
                    <Plus size={16} />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  )
}
