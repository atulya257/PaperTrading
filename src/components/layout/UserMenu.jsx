import { useCallback, useRef, useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useDismiss } from '../../hooks/useDismiss.js'
import './UserMenu.css'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const initial = (user.name.trim()[0] ?? '?').toUpperCase()

  function signOut() {
    logout()
  }

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen((o) => !o)}
      >
        {initial}
      </button>
      {open && (
        <div className="user-popover" role="menu">
          <div className="user-info">
            <p className="user-name">{user.name}</p>
            <p className="user-email">{user.isGuest ? 'Guest demo account' : user.email}</p>
          </div>
          <button type="button" role="menuitem" className="user-item" onClick={signOut}>
            <LogOut size={18} aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
