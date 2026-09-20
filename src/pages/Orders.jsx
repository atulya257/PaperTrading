import { useMemo, useState } from 'react'
import { ReceiptText, SearchX } from 'lucide-react'
import OrdersSummary from '../components/orders/OrdersSummary.jsx'
import OrdersTable from '../components/orders/OrdersTable.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import SegmentedControl from '../components/ui/SegmentedControl.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { ACCOUNT_LIMITS } from '../config/constants.js'
import { summarizeOrders } from '../engine/finance.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import './Orders.css'

const PAGE_SIZE = 50
const SIDES = [
  { value: 'ALL', label: 'All' },
  { value: 'BUY', label: 'Buys', tone: 'gain' },
  { value: 'SELL', label: 'Sells', tone: 'loss' },
]

export default function Orders() {
  usePageTitle('Orders')
  const { account } = useAccount()
  const [side, setSide] = useState('ALL')
  const [symbol, setSymbol] = useState('ALL')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const symbols = useMemo(() => [...new Set(account.orders.map((o) => o.symbol))].sort(), [account.orders])
  const filtered = useMemo(
    () => account.orders.filter((o) => (side === 'ALL' || o.side === side) && (symbol === 'ALL' || o.symbol === symbol)),
    [account.orders, side, symbol],
  )
  const summary = useMemo(() => summarizeOrders(filtered), [filtered])
  const filtering = side !== 'ALL' || symbol !== 'ALL'

  function changeSide(next) {
    setSide(next)
    setVisible(PAGE_SIZE)
  }
  function changeSymbol(next) {
    setSymbol(next)
    setVisible(PAGE_SIZE)
  }
  function clear() {
    changeSide('ALL')
    changeSymbol('ALL')
  }

  return (
    <div className="orders-page">
      <header className="page-head">
        <h1>Orders</h1>
        <p className="page-sub">Every simulated order, filled instantly at the simulated price.</p>
      </header>

      {account.orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={ReceiptText}
            title="No orders yet"
            action={
              <Button to="/markets" size="lg">
                Find a stock to buy
              </Button>
            }
          >
            When you buy or sell, each order is recorded here with its price, total and profit or loss.
          </EmptyState>
        </Card>
      ) : (
        <>
          <OrdersSummary summary={summary} />

          <div className="orders-filters">
            <SegmentedControl label="Filter by side" options={SIDES} value={side} onChange={changeSide} />
            <label className="orders-symbol">
              <span className="sr-only">Filter by stock</span>
              <select value={symbol} onChange={(e) => changeSymbol(e.target.value)}>
                <option value="ALL">All stocks</option>
                {symbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {filtering && (
              <button type="button" className="orders-clear" onClick={clear}>
                Clear filters
              </button>
            )}
            <p className="orders-count" role="status">
              {filtered.length} {filtered.length === 1 ? 'order' : 'orders'}
            </p>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <EmptyState icon={SearchX} title="No orders match these filters">
                Try a different side or stock.
              </EmptyState>
            </Card>
          ) : (
            <>
              <OrdersTable orders={filtered.slice(0, visible)} />
              {filtered.length > visible && (
                <div className="orders-more">
                  <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Show more ({filtered.length - visible} more)
                  </Button>
                </div>
              )}
            </>
          )}

          {account.orders.length >= ACCOUNT_LIMITS.ORDERS_MAX && (
            <p className="orders-foot">
              Only your most recent {ACCOUNT_LIMITS.ORDERS_MAX.toLocaleString('en-IN')} orders are kept. Realized P&amp;L on the
              Portfolio page still includes every sale.
            </p>
          )}
        </>
      )}
    </div>
  )
}
