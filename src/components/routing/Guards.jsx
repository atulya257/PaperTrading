import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { AccountProvider } from '../../context/AccountContext.jsx'
import FullScreenLoader from '../ui/FullScreenLoader.jsx'

export function safeRedirectPath(from) {
  const path = typeof from === 'string' ? from : from?.pathname
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return '/dashboard'
  if (path === '/login' || path === '/signup' || path === '/') return '/dashboard'
  return `${path}${from?.search ?? ''}`
}

export function RequireAuth() {
  const { status, user, signedOut } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullScreenLoader label="Loading…" />
  if (status === 'anonymous' && signedOut) return <Navigate to="/" replace />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />

  return (
    <AccountProvider key={user.id}>
      <Outlet />
    </AccountProvider>
  )
}

export function PublicOnly() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullScreenLoader label="Loading…" />
  if (status === 'authenticated') return <Navigate to={safeRedirectPath(location.state?.from)} replace />
  return <Outlet />
}
