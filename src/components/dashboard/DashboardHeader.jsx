import { Link } from 'react-router-dom'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { portfolioInsights } from '../../engine/finance.js'
import { useMarketSnapshot } from '../../hooks/useMarketData.js'
import './DashboardHeader.css'

export default function DashboardHeader({ portfolio }) {
  const { user } = useAuth()
  const { asOf } = useMarketSnapshot()
  const { best, worst, cashPct } = portfolioInsights(portfolio)
  const hasHoldings = portfolio.holdingsCount > 0

  return (
    <header className="dash-head page-head">
      <h1>Dashboard</h1>
      <ul className="insights" aria-label="Highlights">
        {best && (
          <li>
            Best today{' '}
            <Link to={`/stock/${encodeURIComponent(best.symbol)}`}>{best.symbol}</Link> <ChangeBadge pct={best.dayChangePct} />
          </li>
        )}
        {worst && (
          <li>
            Weakest today{' '}
            <Link to={`/stock/${encodeURIComponent(worst.symbol)}`}>{worst.symbol}</Link> <ChangeBadge pct={worst.dayChangePct} />
          </li>
        )}
        <li>
          {hasHoldings ? (
            <>
              <strong className="num">{cashPct.toFixed(0)}%</strong> of your portfolio is cash
            </>
          ) : (
            <>Your whole portfolio is cash — pick a stock to get started</>
          )}
        </li>
      </ul>
    </header>
  )
}
