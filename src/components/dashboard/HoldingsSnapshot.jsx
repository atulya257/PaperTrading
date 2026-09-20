import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import Button from '../ui/Button.jsx'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import PnlText from '../stock/PnlText.jsx'
import { formatINR } from '../../utils/format.js'
import './MiniList.css'

const SHOWN = 5

export default function HoldingsSnapshot({ holdings }) {
  return (
    <Card title="Holdings" actions={<Link to="/portfolio" className="see-all">View all</Link>}>
      {holdings.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No holdings yet"
          action={
            <Button to="/markets" variant="secondary">
              Explore markets
            </Button>
          }
        >
          Stocks you buy will appear here with their profit and loss.
        </EmptyState>
      ) : (
        <ul className="mini-list">
          {holdings.slice(0, SHOWN).map((h) => (
            <li key={h.symbol}>
              <Link to={`/stock/${encodeURIComponent(h.symbol)}`} className="mini-row">
                <span className="mini-main">
                  <strong>{h.symbol}</strong>
                  <span className="mini-sub num">{h.quantity} shares · {formatINR(h.marketValue)}</span>
                </span>
                <PnlText paise={h.unrealizedPnl} pct={h.unrealizedPnlPct} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {holdings.length > SHOWN && <p className="mini-more">+ {holdings.length - SHOWN} more in your portfolio</p>}
    </Card>
  )
}
