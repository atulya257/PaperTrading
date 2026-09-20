import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import LivePrice from '../stock/LivePrice.jsx'
import PnlText from '../stock/PnlText.jsx'
import SortHeader from '../ui/SortHeader.jsx'
import { useStocks } from '../../hooks/useMarketData.js'
import { formatINR, formatQuantity } from '../../utils/format.js'
import { toggleSort } from '../../utils/search.js'
import '../ui/DataTable.css'
import './HoldingsTable.css'

const SORTERS = {
  value: (h) => h.marketValue,
  pnl: (h) => h.unrealizedPnl,
  pnlPct: (h) => h.unrealizedPnlPct,
  day: (h) => h.dayChangePct,
  name: (h) => h.symbol,
}
const FIRST_DIRECTION = { name: 'asc', value: 'desc', pnl: 'desc', pnlPct: 'desc', day: 'desc' }
const SORT_OPTIONS = [
  { value: 'value:desc', label: 'Current value (high to low)' },
  { value: 'pnl:desc', label: 'Profit (best first)' },
  { value: 'pnl:asc', label: 'Loss (worst first)' },
  { value: 'day:desc', label: 'Today’s move (best first)' },
  { value: 'name:asc', label: 'Name (A to Z)' },
]

function sortHoldings(holdings, { key, dir }) {
  const read = SORTERS[key] ?? SORTERS.value
  const sign = dir === 'asc' ? 1 : -1
  return [...holdings].sort((a, b) => {
    const va = read(a)
    const vb = read(b)
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb
    return sign * cmp || a.symbol.localeCompare(b.symbol)
  })
}

export default function HoldingsTable({ holdings }) {
  const navigate = useNavigate()
  const stocks = useStocks()
  const [sort, setSort] = useState({ key: 'value', dir: 'desc' })
  const names = useMemo(() => new Map(stocks.map((s) => [s.symbol, s.name])), [stocks])
  const rows = sortHoldings(holdings, sort)
  const onSort = (key) => setSort((current) => toggleSort(current, key, FIRST_DIRECTION))

  return (
    <>
      <label className="holdings-sort">
        <span className="sr-only">Sort holdings</span>
        <select
          value={`${sort.key}:${sort.dir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split(':')
            setSort({ key, dir })
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <div className="dt-wrap">
        <table className="dt holdings">
          <caption className="sr-only">Your holdings at simulated prices</caption>
          <thead>
            <tr>
              <SortHeader label="Stock" sortKey="name" sort={sort} onSort={onSort} />
              <th scope="col" className="dt-num">
                Qty
              </th>
              <th scope="col" className="dt-num dt-hide-md">
                Avg price
              </th>
              <th scope="col" className="dt-num">
                Price
              </th>
              <th scope="col" className="dt-num dt-hide-lg">
                Invested
              </th>
              <SortHeader label="Value" sortKey="value" sort={sort} onSort={onSort} className="dt-num" />
              <SortHeader label="P&L" sortKey="pnl" sort={sort} onSort={onSort} className="dt-num" />
              <SortHeader label="Today" sortKey="day" sort={sort} onSort={onSort} className="dt-num dt-hide-md" />
              <th scope="col" className="dt-num dt-hide-lg">
                Weight
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.symbol} className="dt-clickable" onClick={() => navigate(`/stock/${encodeURIComponent(h.symbol)}`)}>
                <th scope="row" className="dt-primary">
                  <Link to={`/stock/${encodeURIComponent(h.symbol)}`} className="dt-symbol" onClick={(e) => e.stopPropagation()}>
                    <strong>{h.symbol}</strong>
                    <span className="dt-sub">{names.get(h.symbol)}</span>
                  </Link>
                </th>
                <td className="dt-num" data-label="Quantity">
                  {formatQuantity(h.quantity)}
                </td>
                <td className="dt-num dt-hide-md" data-label="Avg price">
                  {formatINR(h.averagePrice)}
                </td>
                <td className="dt-num" data-label="Price">
                  <LivePrice paise={h.price} />
                </td>
                <td className="dt-num dt-hide-lg dt-hide-sm" data-label="Invested">
                  {formatINR(h.invested)}
                </td>
                <td className="dt-num strong" data-label="Current value">
                  {formatINR(h.marketValue)}
                </td>
                <td className="dt-num" data-label="Unrealized P&L">
                  <PnlText paise={h.unrealizedPnl} pct={h.unrealizedPnlPct} />
                </td>
                <td className="dt-num dt-hide-md" data-label="Today">
                  <ChangeBadge pct={h.dayChangePct} />
                </td>
                <td className="dt-num dt-hide-lg dt-hide-sm dt-muted" data-label="Weight">
                  {h.weightPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
