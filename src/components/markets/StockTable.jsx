import { memo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import DayRange from '../stock/DayRange.jsx'
import LivePrice from '../stock/LivePrice.jsx'
import WatchButton from '../stock/WatchButton.jsx'
import SortHeader from '../ui/SortHeader.jsx'
import { useQuote } from '../../hooks/useMarketData.js'
import { formatCompactINR } from '../../utils/format.js'
import './StockTable.css'

const StockRow = memo(function StockRow({ stock }) {
  const quote = useQuote(stock.symbol)
  const navigate = useNavigate()
  if (!quote) return null

  return (
    <tr className="stock-row" onClick={() => navigate(`/stock/${encodeURIComponent(stock.symbol)}`)}>
      <td className="cell-watch">
        <WatchButton symbol={stock.symbol} />
      </td>
      <th scope="row" className="cell-name">
        <Link to={`/stock/${encodeURIComponent(stock.symbol)}`} onClick={(e) => e.stopPropagation()} className="row-link">
          <span className="row-symbol">{stock.symbol}</span>
          <span className="row-company">{stock.name}</span>
        </Link>
      </th>
      <td className="cell-sector">{stock.sector}</td>
      <td className="cell-price num">
        <LivePrice paise={quote.price} />
      </td>
      <td className="cell-change">
        <ChangeBadge pct={quote.changePct} />
      </td>
      <td className="cell-range">
        <DayRange compact low={quote.dayLow} high={quote.dayHigh} price={quote.price} />
      </td>
      <td className="cell-cap num">{formatCompactINR(stock.marketCap)}</td>
    </tr>
  )
})

export default function StockTable({ stocks, sort, onSort }) {
  return (
    <div className="table-wrap">
      <table className="stock-table">
        <caption className="sr-only">Simulated stocks with price and today’s change</caption>
        <thead>
          <tr>
            <th scope="col" className="cell-watch">
              <span className="sr-only">Watchlist</span>
            </th>
            <SortHeader label="Company" sortKey="name" sort={sort} onSort={onSort} className="cell-name" />
            <th scope="col" className="cell-sector">
              Sector
            </th>
            <SortHeader label="Price" sortKey="price" sort={sort} onSort={onSort} className="cell-price" />
            <SortHeader label="Change" sortKey="change" sort={sort} onSort={onSort} className="cell-change" />
            <th scope="col" className="cell-range">
              Day range
            </th>
            <SortHeader label="Market cap" sortKey="marketCap" sort={sort} onSort={onSort} className="cell-cap" />
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <StockRow key={stock.symbol} stock={stock} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
