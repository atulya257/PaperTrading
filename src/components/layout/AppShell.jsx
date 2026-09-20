import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import ErrorBoundary from '../ui/ErrorBoundary.jsx'
import TopBar from './TopBar.jsx'
import TabNav from './TabNav.jsx'
import CommandSearch from './CommandSearch.jsx'
import './AppShell.css'

const isTypingTarget = (el) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

export default function AppShell() {
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="shell-body">
        <TopBar onSearch={openSearch} />
        <TabNav />
        <main id="main" className="shell-main" tabIndex={-1}>
          <ErrorBoundary variant="inline" resetKey={pathname}>
            <div key={pathname} className="page-enter">
              <Outlet />
            </div>
          </ErrorBoundary>
        </main>
      </div>
      <CommandSearch open={searchOpen} onClose={closeSearch} />
    </div>
  )
}
