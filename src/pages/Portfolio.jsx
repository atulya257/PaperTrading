import { Link } from 'react-router-dom'
import AllocationCard from '../components/portfolio/AllocationCard.jsx'
import HoldingsTable from '../components/portfolio/HoldingsTable.jsx'
import PerformanceCard from '../components/portfolio/PerformanceCard.jsx'
import PortfolioSummary from '../components/portfolio/PortfolioSummary.jsx'
import StartInvesting from '../components/portfolio/StartInvesting.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { usePortfolio } from '../hooks/usePortfolio.js'
import './Portfolio.css'

export default function Portfolio() {
  usePageTitle('Portfolio')
  const portfolio = usePortfolio()
  const hasHoldings = portfolio.holdingsCount > 0

  return (
    <div className="portfolio">
      <header className="page-head">
        <h1>Portfolio</h1>
        <p className="page-sub">
          Valued at simulated prices · <Link to="/orders">View orders</Link>
        </p>
      </header>

      <PortfolioSummary portfolio={portfolio} />

      <div className="portfolio-grid">
        <PerformanceCard />
        <AllocationCard allocation={portfolio.allocation} hasHoldings={hasHoldings} />
      </div>

      <section aria-labelledby="holdings-title">
        <h2 id="holdings-title" className="section-heading">
          Holdings {hasHoldings && <span className="count">({portfolio.holdingsCount})</span>}
        </h2>
        {hasHoldings ? <HoldingsTable holdings={portfolio.holdings} /> : <StartInvesting />}
      </section>
    </div>
  )
}
