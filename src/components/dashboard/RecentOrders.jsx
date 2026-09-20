import { Link } from 'react-router-dom'
import { ReceiptText } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import PnlText from '../stock/PnlText.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { useMarketSnapshot } from '../../hooks/useMarketData.js'
import { formatINR, formatQuantity, formatRelativeTime } from '../../utils/format.js'
import '../orders/OrdersTable.css'
import './MiniList.css'

const SHOWN = 5

export default function RecentOrders() {
  const { account } = useAccount()
  const { asOf } = useMarketSnapshot()
  const orders = account.orders.slice(0, SHOWN)

  return (
    <Card title="Recent orders" actions={<Link to="/orders" className="see-all">View all</Link>}>
      {orders.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No orders yet"
          action={
            <Button to="/markets" variant="secondary">
              Find a stock
            </Button>
          }
        >
          Your first buy or sell will show up here.
        </EmptyState>
      ) : (
        <ul className="mini-list">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/stock/${encodeURIComponent(o.symbol)}`} className="mini-row">
                <span className="mini-main">
                  <span className="mini-title">
                    <span className={`side-badge side-${o.side.toLowerCase()}`}>{o.side === 'BUY' ? 'Buy' : 'Sell'}</span>
                    <strong>{o.symbol}</strong>
                  </span>
                  <span className="mini-sub num">
                    {formatQuantity(o.quantity)} × {formatINR(o.price)} · {formatRelativeTime(o.createdAt, asOf)}
                  </span>
                </span>
                {o.realizedPnl === null ? <span className="mini-total num">{formatINR(o.total)}</span> : <PnlText paise={o.realizedPnl} />}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
