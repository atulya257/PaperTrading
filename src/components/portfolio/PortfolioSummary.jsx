import Card from '../ui/Card.jsx'
import StatTile from '../ui/StatTile.jsx'
import PnlText from '../stock/PnlText.jsx'
import { formatINR } from '../../utils/format.js'
import './PortfolioSummary.css'

export default function PortfolioSummary({ portfolio: p }) {
  return (
    <Card className="summary" aria-label="Portfolio summary">
      <div className="summary-hero">
        <StatTile
          hero
          label="Portfolio value"
          sub={
            <div className="summary-deltas">
              <span>
                Today <PnlText paise={p.dayPnl} pct={p.dayPnlPct} />
              </span>
              <span>
                Total return <PnlText paise={p.totalReturn} pct={p.totalReturnPct} />
              </span>
            </div>
          }
        >
          {formatINR(p.totalValue)}
        </StatTile>
      </div>

      <div className="summary-grid">
        <StatTile label="Cash">{formatINR(p.cash)}</StatTile>
        <StatTile label="Invested">{formatINR(p.invested)}</StatTile>
        <StatTile label="Current value">{formatINR(p.marketValue)}</StatTile>
        <StatTile label="Unrealized P&L" sub="On shares you still hold">
          <PnlText paise={p.unrealizedPnl} pct={p.unrealizedPnlPct} />
        </StatTile>
        <StatTile label="Realized P&L" sub="Locked in by selling">
          <PnlText paise={p.realizedPnl} />
        </StatTile>
      </div>
    </Card>
  )
}
