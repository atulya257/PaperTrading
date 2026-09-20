import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../config/constants.js'
import * as authService from '../services/authService.js'


const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading')
  const [signedOut, setSignedOut] = useState(false)

  const apply = useCallback((nextUser) => {
    setUser(nextUser)
    if (nextUser) setSignedOut(false)
    setStatus(nextUser ? 'authenticated' : 'anonymous')
  }, [])

  useEffect(() => {
    let cancelled = false
    authService.getSession().then((u) => !cancelled && apply(u))
    const onStorage = (e) => {
      if (e.key === STORAGE_KEYS.session || e.key === STORAGE_KEYS.users) {
        authService.getSession().then((u) => !cancelled && apply(u))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      cancelled = true
      window.removeEventListener('storage', onStorage)
    }
  }, [apply])

  const run = useCallback(
    async (action) => {
      const result = await action()
      if (result.ok) apply(result.user)
      return result
    },
    [apply],
  )

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: status === 'authenticated',
      signedOut,
      signup: (details) => run(() => authService.signup(details)),
      login: (details) => run(() => authService.login(details)),
      guestLogin: () => run(() => authService.guest()),
      logout: async () => {
        await authService.logout()
        setSignedOut(true)
        apply(null)
      },
    }),
    [user, status, signedOut, run, apply],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
