import { NavLink } from 'react-router-dom'
import { Search, Settings, Wallet } from 'lucide-react'
import UserMenu from './UserMenu.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { formatINR } from '../../utils/format.js'
import './TopBar.css'

export default function TopBar({ onSearch }) {
  const { account } = useAccount()

  return (
    <header className="topbar">
      <div className="topbar-start">
        <div className="cash-chip" title="Available virtual cash">
          <span className="cash-icon">
            <Wallet size={18} aria-hidden="true" />
          </span>
          <span className="cash-text">
            <span className="cash-label">Available cash</span>
            <span className="num cash-value">{formatINR(account.cash)}</span>
          </span>
        </div>
      </div>

      <button type="button" className="search-trigger" onClick={onSearch} aria-label="Search stocks">
        <Search size={20} aria-hidden="true" />
        <span className="search-trigger-text">Search stocks</span>
      </button>

      <div className="topbar-actions">
        <NavLink to="/settings" className="settings-link" aria-label="Settings" title="Settings">
          <Settings size={22} aria-hidden="true" />
        </NavLink>
        <UserMenu />
      </div>
    </header>
  )
}
