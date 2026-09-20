import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NAV_ITEMS } from '../../config/constants.js'
import './TabNav.css'

export default function TabNav() {
  const { pathname } = useLocation()
  const listRef = useRef(null)

  useEffect(() => {
    const active = listRef.current?.querySelector('.tab-link.active')
    active?.scrollIntoView?.({ inline: 'center', block: 'nearest' })
  }, [pathname])

  return (
    <nav className="tabnav" aria-label="Primary">
      <div className="tabnav-list" ref={listRef}>
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink key={to} to={to} className="tab-link">
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
