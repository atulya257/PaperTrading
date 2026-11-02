import { Link } from 'react-router-dom'
import Card from '../ui/Card.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useMarketSnapshot } from '../../hooks/useMarketData.js'
import { SIDE } from '../../engine/trading.js'
import { formatINR, formatPercent, formatQuantity, formatShortDateTime } from '../../utils/format.js'
import './OrdersTable.css'
import './OpenOrders.css'

/** Limit orders still waiting for their price. Shows every stock, or just one when `symbol` is given. */
export default function OpenOrders({ symbol }) {
  const { account, cancelLimit } = useAccount()
  const { quotes } = useMarketSnapshot()
  const toast = useToast()
  const orders = account.openOrders.filter((o) => !symbol || o.symbol === symbol)
  if (orders.length === 0) return null

  function cancel(order) {
    const result = cancelLimit(order.id)
    if (!result.ok) {
      toast.error('Could not cancel the order', result.error.message)
      return
    }
    const freed = order.side === SIDE.BUY ? 'The cash set aside for it is free again.' : 'Those shares are free to sell again.'
    toast.success(`${order.side === SIDE.BUY ? 'Buy' : 'Sell'} order cancelled`, `${formatQuantity(order.quantity)} ${order.symbol}. ${freed}`)
  }

  return (
    <Card title={`Open orders (${orders.length})`}>
      <ul className="open-orders">
        {orders.map((o) => {
          const isBuy = o.side === SIDE.BUY
          const price = quotes[o.symbol]?.price
          const gap = price ? ((o.limitPrice - price) / price) * 100 : null
          return (
            <li key={o.id} className="open-order">
              <div className="open-order-main">
                <span className={`side-badge side-${o.side.toLowerCase()}`}>{isBuy ? 'Buy' : 'Sell'}</span>
                <p>
                  <strong>
                    {formatQuantity(o.quantity)}{' '}
                    {symbol ? 'shares' : <Link to={`/stock/${encodeURIComponent(o.symbol)}`}>{o.symbol}</Link>}
                  </strong>{' '}
                  at <span className="num">{formatINR(o.limitPrice)}</span> or {isBuy ? 'lower' : 'higher'}
                </p>
              </div>
              <p className="open-order-meta">
                {price ? (
                  <>
                    Price now <span className="num">{formatINR(price)}</span>, {formatPercent(Math.abs(gap), { signed: false })}{' '}
                    {isBuy ? 'above' : 'below'} your price.
                  </>
                ) : (
                  'Waiting for a price.'
                )}{' '}
                Placed {formatShortDateTime(o.createdAt)}.
              </p>
              <button type="button" className="open-order-cancel" onClick={() => cancel(o)}>
                Cancel<span className="sr-only"> this order</span>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
