import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { STORAGE_KEYS, VALUE_SAMPLE_MS } from '../config/constants.js'
import {
  markViewed as markSymbolViewed,
  needsNewSession,
  recordValueSnapshot,
  startSession,
  toggleWatchlist as toggleSymbolInWatchlist,
} from '../engine/account.js'
import { computePortfolio, valueAtPreviousClose } from '../engine/finance.js'
import { executeOrder } from '../engine/trading.js'
import { loadAccount, resetAccount, saveAccount } from '../services/accountService.js'
import { newId } from '../utils/id.js'
import { useAuth } from './AuthContext.jsx'
import { useMarket } from './MarketContext.jsx'
import { useToast } from './ToastContext.jsx'
import FullScreenLoader from '../components/ui/FullScreenLoader.jsx'

const AccountContext = createContext(null)

export function AccountProvider({ children }) {
  const { user } = useAuth()
  const market = useMarket()
  const toast = useToast()
  const userId = user.id

  const [account, setAccount] = useState(null)
  const accountRef = useRef(null)
  const warnedAboutStorage = useRef(false)

  const commit = useCallback(
    (next) => {
      accountRef.current = next
      setAccount(next)
      saveAccount(userId, next).then((persisted) => {
        if (!persisted && !warnedAboutStorage.current) {
          warnedAboutStorage.current = true
          toast.error('Progress is not being saved', 'Your browser is blocking local storage, so this demo will reset when you close the tab.')
        }
      })
    },
    [userId, toast],
  )

  useEffect(() => {
    let cancelled = false
    loadAccount(userId, { sessionDate: market.getSnapshot().sessionDate }).then(({ account: loaded, recovered }) => {
      if (cancelled) return
      let current = loaded
      const snap = market.getSnapshot()
      if (needsNewSession(current, snap.sessionDate)) {
        current = startSession(current, {
          sessionDate: snap.sessionDate,
          dayOpenValue: valueAtPreviousClose(current, snap.quotes),
        })
        saveAccount(userId, current)
      }
      accountRef.current = current
      setAccount(current)
      if (recovered) {
        toast.info('We started your account fresh', 'Your saved data could not be read, so a new ₹10,00,000 account was created.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId, market, toast])

  const ready = account !== null
  useEffect(() => {
    if (!ready) return undefined
    let lastSample = accountRef.current.valueHistory.at(-1)?.t ?? 0
    return market.subscribe(() => {
      const snap = market.getSnapshot()
      let current = accountRef.current
      if (!current) return
      let changed = false
      if (needsNewSession(current, snap.sessionDate)) {
        current = startSession(current, {
          sessionDate: snap.sessionDate,
          dayOpenValue: valueAtPreviousClose(current, snap.quotes),
        })
        changed = true
      }
      if (!snap.status.following && snap.asOf - lastSample >= VALUE_SAMPLE_MS) {
        lastSample = snap.asOf
        current = recordValueSnapshot(current, snap.asOf, computePortfolio(current, snap.quotes).totalValue)
        changed = true
      }
      if (changed) commit(current)
    })
  }, [ready, market, commit])

  useEffect(() => {
    const key = STORAGE_KEYS.account(userId)
    const onStorage = (e) => {
      if (e.key !== key) return
      loadAccount(userId, { sessionDate: market.getSnapshot().sessionDate }).then(({ account: latest }) => {
        accountRef.current = latest
        setAccount(latest)
      })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [userId, market])

  const placeOrder = useCallback(
    async (request) => {
      const current = accountRef.current
      if (!current) return { ok: false, error: { code: 'NOT_READY', message: 'Your account is still loading.' } }
      const snap = market.getSnapshot()
      const now = Date.now()
      const result = executeOrder(current, request, snap.quotes[request?.symbol], { id: newId(), now })
      if (result.ok) {
        const value = computePortfolio(result.account, snap.quotes).totalValue
        commit(recordValueSnapshot(result.account, now, value))
      }
      return result
    },
    [market, commit],
  )

  const toggleWatchlist = useCallback(
    (symbol) => {
      const current = accountRef.current
      const next = toggleSymbolInWatchlist(current, symbol)
      if (next !== current) commit(next)
      return next.watchlist.includes(symbol)
    },
    [commit],
  )

  const markViewed = useCallback(
    (symbol) => {
      const current = accountRef.current
      const next = markSymbolViewed(current, symbol)
      if (next !== current) commit(next)
    },
    [commit],
  )

  const resetSimulator = useCallback(async () => {
    market.reset()
    const fresh = await resetAccount(userId, { sessionDate: market.getSnapshot().sessionDate })
    accountRef.current = fresh
    setAccount(fresh)
    toast.success('Simulator reset', 'You have ₹10,00,000 of virtual cash again.')
  }, [market, userId, toast])

  const value = useMemo(
    () => ({ account, placeOrder, toggleWatchlist, markViewed, resetSimulator }),
    [account, placeOrder, toggleWatchlist, markViewed, resetSimulator],
  )

  if (!account) return <FullScreenLoader label="Loading your account…" />
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  const ctx = useContext(AccountContext)
  if (!ctx) throw new Error('useAccount must be used inside <AccountProvider>')
  return ctx
}
