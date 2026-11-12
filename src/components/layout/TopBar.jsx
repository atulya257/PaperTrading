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
      <div className="topbar-inner">
        <span className="topbar-spacer" aria-hidden="true" />
        <button type="button" className="search-trigger" onClick={onSearch} aria-label="Search stocks">
          <Search size={18} strokeWidth={2.2} className="search-trigger-icon" aria-hidden="true" />
          <span className="search-trigger-text">Search stocks</span>
        </button>

        <div className="topbar-actions">
          <div className="topbar-cash" title="Cash you can trade with">
            <span className="topbar-cash-label">Cash</span>
            <span className="num">{formatINR(account.cash)}</span>
          </div>
          <NavLink to="/settings" className="settings-link" aria-label="Settings" title="Settings">
            <Settings size={19} aria-hidden="true" />
          </NavLink>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
