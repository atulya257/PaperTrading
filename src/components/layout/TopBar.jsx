import { NavLink } from 'react-router-dom'
import { Search, Settings } from 'lucide-react'
import UserMenu from './UserMenu.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { formatINR } from '../../utils/format.js'
import './TopBar.css'

export default function TopBar({ onSearch }) {
  const { account } = useAccount()

  return (
    <header className="topbar">
      <button type="button" className="search-trigger" onClick={onSearch} aria-label="Search stocks">
        <Search size={17} aria-hidden="true" />
        <span className="search-trigger-text">Search stocks by name or symbol</span>
      </button>

      <div className="topbar-actions">
        <div className="cash" title="Virtual cash you can spend">
          <span className="cash-label">Cash</span>
          <span className="num cash-value">{formatINR(account.cash)}</span>
        </div>
        <NavLink to="/settings" className="settings-link" aria-label="Settings" title="Settings">
          <Settings size={19} aria-hidden="true" />
        </NavLink>
        <UserMenu />
      </div>
    </header>
  )
}
