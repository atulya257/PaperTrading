import { useCallback, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useDismiss } from '../../hooks/useDismiss.js'
import './UserMenu.css'

export default function UserMenu({ placement = 'down', showName = false }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const initial = (user.name.trim()[0] ?? '?').toUpperCase()
  const detail = user.email

  return (
    <div className={`user-menu user-menu-${placement}`} ref={ref}>
      <button
        type="button"
        className={showName ? 'user-trigger' : 'user-trigger is-compact'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="user-avatar" aria-hidden="true">
          {initial}
        </span>
        {showName && (
          <span className="user-label" aria-hidden="true">
            <span className="user-label-name">{user.name}</span>
            <span className="user-label-detail">{detail}</span>
          </span>
        )}
      </button>
      {open && (
        <div className="user-popover" role="menu">
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{detail}</p>
          </div>
          <button type="button" role="menuitem" className="user-item" onClick={logout}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
