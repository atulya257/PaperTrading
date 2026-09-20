import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import { usePortfolio } from '../../hooks/usePortfolio.js'
import { formatINR, formatQuantity, formatSignedINR, trendOf } from '../../utils/format.js'
import './PositionCard.css'

export default function PositionCard({ symbol }) {
  const { holdings } = usePortfolio()
  const holding = holdings.find((h) => h.symbol === symbol)

  if (!holding) {
    return (
      <Card title="Your position">
        <EmptyState icon={Briefcase} title={`You do not hold ${symbol}`}>
          Place a buy order to open a position. Your average price and profit and loss will appear here.
        </EmptyState>
      </Card>
    )
  }

  const trend = trendOf(holding.unrealizedPnl)
  const rows = [
    ['Quantity', formatQuantity(holding.quantity)],
    ['Average buy price', formatINR(holding.averagePrice)],
    ['Invested', formatINR(holding.invested)],
    ['Current value', formatINR(holding.marketValue)],
    ['Share of portfolio', `${holding.weightPct.toFixed(1)}%`],
  ]

  return (
    <Card title="Your position" actions={<Link to="/portfolio" className="position-link">Portfolio</Link>}>
      <div className={`position-pnl ${trend}`}>
        <span className="position-pnl-label">Unrealized P&amp;L</span>
        <span className="position-pnl-amount num">{formatSignedINR(holding.unrealizedPnl)}</span>
        <ChangeBadge pct={holding.unrealizedPnlPct} />
      </div>
      <dl className="position-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className="num">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
