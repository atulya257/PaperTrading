import AllocationCard from '../components/portfolio/AllocationCard.jsx'
import HoldingsTable from '../components/portfolio/HoldingsTable.jsx'
import PortfolioHero from '../components/portfolio/PortfolioHero.jsx'
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
      </header>

      <PortfolioHero portfolio={portfolio} />

      <section aria-labelledby="holdings-title">
        <h2 id="holdings-title" className="section-heading">
          Holdings {hasHoldings && <span className="count">({portfolio.holdingsCount})</span>}
        </h2>
        {hasHoldings ? <HoldingsTable holdings={portfolio.holdings} /> : <StartInvesting />}
      </section>

      <AllocationCard allocation={portfolio.allocation} hasHoldings={hasHoldings} />
    </div>
  )
}
