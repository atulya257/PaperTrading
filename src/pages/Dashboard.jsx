import DashboardHeader from '../components/dashboard/DashboardHeader.jsx'
import HoldingsSnapshot from '../components/dashboard/HoldingsSnapshot.jsx'
import NewsPreview from '../components/dashboard/NewsPreview.jsx'
import RecentOrders from '../components/dashboard/RecentOrders.jsx'
import RecentlyViewed from '../components/dashboard/RecentlyViewed.jsx'
import WatchlistSnapshot from '../components/dashboard/WatchlistSnapshot.jsx'
import WelcomeCard from '../components/dashboard/WelcomeCard.jsx'
import MarketPulse from '../components/markets/MarketPulse.jsx'
import Movers from '../components/markets/Movers.jsx'
import PerformanceCard from '../components/portfolio/PerformanceCard.jsx'
import PortfolioSummary from '../components/portfolio/PortfolioSummary.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { usePortfolio } from '../hooks/usePortfolio.js'
import './Dashboard.css'

export default function Dashboard() {
  usePageTitle('Dashboard')
  const portfolio = usePortfolio()
  const { account } = useAccount()
  const isNewAccount = account.orders.length === 0

  return (
    <div className="dashboard">
      <DashboardHeader portfolio={portfolio} />
      {isNewAccount && <WelcomeCard />}
      <PortfolioSummary portfolio={portfolio} />
      <RecentlyViewed />

      <div className="dash-grid">
        <PerformanceCard />
        <div className="dash-side">
          <HoldingsSnapshot holdings={portfolio.holdings} />
          <WatchlistSnapshot />
        </div>
      </div>

      <MarketPulse />

      <div className="dash-even">
        <RecentOrders />
        <NewsPreview />
      </div>

      <Movers />
    </div>
  )
}
