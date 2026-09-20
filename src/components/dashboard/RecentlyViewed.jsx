import { Link } from 'react-router-dom'
import { useAccount } from '../../context/AccountContext.jsx'
import './MiniList.css'

export default function RecentlyViewed() {
  const { account } = useAccount()
  if (account.recentlyViewed.length === 0) return null
  return (
    <nav className="recent" aria-label="Recently viewed stocks">
      <span className="recent-label">Recently viewed</span>
      {account.recentlyViewed.map((symbol) => (
        <Link key={symbol} to={`/stock/${encodeURIComponent(symbol)}`} className="recent-chip">
          {symbol}
        </Link>
      ))}
    </nav>
  )
}
