import { useCallback, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import ErrorBoundary from '../ui/ErrorBoundary.jsx'
import TopBar from './TopBar.jsx'
import TabNav from './TabNav.jsx'
import CommandSearch from './CommandSearch.jsx'
import TickerTape from '../markets/TickerTape.jsx'
import './AppShell.css'

export default function AppShell() {
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="shell-body">
        <TopBar onSearch={openSearch} />
        <TabNav placement="top" />
        <TickerTape />
        <main id="main" className="shell-main" tabIndex={-1}>
          <ErrorBoundary variant="inline" resetKey={pathname}>
            <div key={pathname} className="page-enter">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
      <TabNav placement="bottom" />
      <CommandSearch open={searchOpen} onClose={closeSearch} />
    </div>
  )
}
