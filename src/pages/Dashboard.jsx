import { Link } from 'react-router-dom'
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import HoldingsSnapshot from '../components/dashboard/HoldingsSnapshot.jsx'
import NewsPreview from '../components/dashboard/NewsPreview.jsx'
import RecentOrders from '../components/dashboard/RecentOrders.jsx'
import RecentlyViewed from '../components/dashboard/RecentlyViewed.jsx'
import WatchlistSnapshot from '../components/dashboard/WatchlistSnapshot.jsx'
import MarketMap from '../components/markets/MarketMap.jsx'
import PortfolioHero from '../components/portfolio/PortfolioHero.jsx'
import Card from '../components/ui/Card.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { usePortfolio } from '../hooks/usePortfolio.js'
import './Dashboard.css'

export default function Dashboard() {
  usePageTitle('Dashboard')
  const portfolio = usePortfolio()

  return (
    <div className="dashboard">
      <DashboardHeader portfolio={portfolio} />
      <PortfolioHero portfolio={portfolio} />
      <RecentlyViewed />

      <div className="dash-grid">
        <Card
          title="Today's market"
          className="dash-map"
          actions={
            <Link to="/markets" className="see-all">
              All stocks
            </Link>
          }
        >
          <MarketMap />
        </Card>
        <div className="dash-side">
          <HoldingsSnapshot holdings={portfolio.holdings} />
          <WatchlistSnapshot />
        </div>
      </div>

      <div className="dash-even">
        <RecentOrders />
        <NewsPreview />
      </div>
    </div>
  )
}
