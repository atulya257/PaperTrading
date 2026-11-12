import { useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { NAV_ICONS } from './navIcons.js'
import { NAV_ITEMS } from '../../config/constants.js'
import { useActiveIndicator } from '../../hooks/useActiveIndicator.js'
import './TabNav.css'

const SHORT = { Dashboard: 'Home', Watchlist: 'Watch' }

export default function TabNav({ placement = 'bottom' }) {
  const { pathname } = useLocation()
  const listRef = useRef(null)
  const box = useActiveIndicator(listRef, '.tab-link.active .tab-icon', pathname)

  return (
    <nav className={`tabnav tabnav-${placement}`} aria-label="Primary">
      <div className="tabnav-list" ref={listRef}>
        <span
          className={`tab-pill${box && !box.hidden ? '' : ' is-hidden'}`}
          style={box ? { width: box.width, transform: `translateX(${box.x}px)` } : undefined}
          aria-hidden="true"
        />
        {NAV_ITEMS.map(({ to, label }) => {
          const Icon = NAV_ICONS[to]
          return (
            <NavLink key={to} to={to} className="tab-link">
              <span className="tab-icon">
                <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="tab-label">{SHORT[label] ?? label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
