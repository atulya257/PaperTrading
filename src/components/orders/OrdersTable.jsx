import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PnlText from '../stock/PnlText.jsx'
import { useStocks } from '../../hooks/useMarketData.js'
import { formatDateTime, formatINR, formatQuantity, formatShortDateTime } from '../../utils/format.js'
import '../ui/DataTable.css'
import './OrdersTable.css'

export default function OrdersTable({ orders }) {
  const navigate = useNavigate()
  const stocks = useStocks()
  const names = useMemo(() => new Map(stocks.map((s) => [s.symbol, s.name])), [stocks])

  return (
    <div className="dt-wrap">
      <table className="dt orders">
        <caption className="sr-only">Your order history, newest first</caption>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Stock</th>
            <th scope="col">Side</th>
            <th scope="col" className="dt-num">
              Qty
            </th>
            <th scope="col" className="dt-num dt-hide-md">
              Price
            </th>
            <th scope="col" className="dt-num">
              Total
            </th>
            <th scope="col" className="dt-num">
              Realized P&amp;L
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="dt-clickable" onClick={() => navigate(`/stock/${encodeURIComponent(o.symbol)}`)}>
              <td data-label="Time">
                <div className="order-when">
                  <time className="order-time" dateTime={new Date(o.createdAt).toISOString()} title={formatDateTime(o.createdAt)}>
                    {formatShortDateTime(o.createdAt)}
                  </time>
                  <span className="dt-sub order-id">Order {o.id.slice(0, 8)}</span>
                </div>
              </td>
              <th scope="row" className="dt-primary">
                <Link to={`/stock/${encodeURIComponent(o.symbol)}`} className="dt-symbol" onClick={(e) => e.stopPropagation()}>
                  <strong>{o.symbol}</strong>
                  <span className="dt-sub">{names.get(o.symbol)}</span>
                </Link>
              </th>
              <td data-label="Side">
                <span className={`side-badge side-${o.side.toLowerCase()}`}>{o.side === 'BUY' ? 'Buy' : 'Sell'}</span>
              </td>
              <td className="dt-num" data-label="Quantity">
                {formatQuantity(o.quantity)}
              </td>
              <td className="dt-num dt-hide-md" data-label="Price">
                {formatINR(o.price)}
              </td>
              <td className="dt-num strong" data-label="Total">
                {formatINR(o.total)}
              </td>
              <td className="dt-num" data-label="Realized P&L">
                {o.realizedPnl === null ? <span className="dt-muted">—</span> : <PnlText paise={o.realizedPnl} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
