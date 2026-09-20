
import { STORAGE_KEYS } from '../../../config/constants.js'
import * as storage from '../../storage.js'
import { STOCKS, toPublicStock } from './stocks.js'
import { randomSeed } from './rng.js'
import {
  buildSimMeta,
  computeBreadth,
  computeIndex,
  createInitialState,
  isValidMarketState,
  moodLabel,
  observedMood,
  rollSession,
  stepMarket,
} from './simulator.js'
import { generateBaseHistory } from './history.js'
import { dateKey, prevTradingDay } from './dates.js'
import { getSampleNews } from './news.js'

export const SOURCE = 'demo-simulation'
export const SPEEDS = { calm: 2000, normal: 1000, fast: 400 }
export const PERSIST_MS = 2000
export const FOLLOWER_TIMEOUT_MS = 6000
export const MAX_CATCHUP_TICKS = 300
export const WARMUP_TICKS = 240
export const SPEED_OPTIONS = [
  { value: 'calm', label: 'Calm', description: 'Gentle movement — a trading day of volatility takes about 20 minutes.' },
  { value: 'normal', label: 'Normal', description: 'The default — about 10 minutes per trading day.' },
  { value: 'fast', label: 'Fast', description: 'A whole trading day in about 4 minutes. Good for demos.' },
]
const WATCH_MS = 2000
const PERIOD_DAYS = { '1M': 30, '3M': 91, '6M': 182, '1Y': 366 }
const WEEK_MS = 7 * 86_400_000

function defaultWriterId() {
  try {
    let id = sessionStorage.getItem('tradelab:tab-id')
    if (!id) {
      id = Math.random().toString(36).slice(2, 10)
      sessionStorage.setItem('tradelab:tab-id', id)
    }
    return id
  } catch {
    return Math.random().toString(36).slice(2, 10)
  }
}

export function createDemoMarketProvider({
  now = Date.now,
  key = STORAGE_KEYS.market,
  seed,
  writerId = defaultWriterId(),
} = {}) {
  const sim = buildSimMeta(STOCKS)
  const publicStocks = STOCKS.map(toPublicStock)
  const validate = (d) => isValidMarketState(d, sim)

  let state
  let base = { endKey: null, map: new Map() }
  let snapshot = null
  let mode = 'leader'
  let started = false
  let timer = null
  let watchTimer = null
  let lastPersistAt = 0
  let lastForeignWrite = 0
  const listeners = new Set()


  function ensureBase(endKey) {
    if (base.endKey === endKey) return
    const map = new Map()
    for (const s of STOCKS) map.set(s.symbol, generateBaseHistory(s, s.basePrice, endKey))
    base = { endKey, map }
  }

  function freshState(useSeed) {
    const t = now()
    const sessionDate = dateKey(t)
    const baseEndDate = prevTradingDay(sessionDate)
    ensureBase(baseEndDate)
    const tickMs = SPEEDS.normal
    const startTime = t - WARMUP_TICKS * tickMs
    const s = createInitialState({
      seed: useSeed ?? seed ?? randomSeed(),
      now: startTime,
      sessionDate,
      baseEndDate,
      sim,
      base: Object.fromEntries(STOCKS.map((x) => [x.symbol, base.map.get(x.symbol)])),
    })
    for (let i = 1; i <= WARMUP_TICKS; i++) stepMarket(s, sim, startTime + i * tickMs)
    s.lastTickAt = t
    return s
  }

  function readStored() {
    return storage.read(key, { validate, fallback: null })
  }

  function init() {
    let loaded = readStored()
    if (!loaded && storage.isCorrupt(key, validate)) storage.quarantine(key)
    if (loaded) {
      ensureBase(loaded.baseEndDate)
      loaded.events ??= []
    }
    state = loaded ?? freshState()
    snapshot = buildSnapshot(null)
  }


  function buildSnapshot(prev) {
    const quotes = {}
    for (const s of sim.list) {
      const st = state.stocks[s.symbol]
      const p = prev?.quotes[s.symbol]
      if (
        p &&
        p.price === st.price &&
        p.prevClose === st.prevClose &&
        p.dayHigh === st.dayHigh &&
        p.dayLow === st.dayLow &&
        p.high52 === st.high52 &&
        p.low52 === st.low52 &&
        p.state === 'live'
      ) {
        quotes[s.symbol] = p
        continue
      }
      const change = st.price - st.prevClose
      quotes[s.symbol] = {
        symbol: s.symbol,
        price: st.price,
        prevClose: st.prevClose,
        change,
        changePct: (change / st.prevClose) * 100,
        dayHigh: st.dayHigh,
        dayLow: st.dayLow,
        high52: st.high52,
        low52: st.low52,
        state: 'live',
        source: SOURCE,
      }
    }
    const index = computeIndex(state, sim)
    const breadth = computeBreadth(state, sim)
    const mood = observedMood(index.changePct, breadth)
    return {
      quotes,
      index,
      mood,
      moodLabel: moodLabel(mood),
      breadth,
      sessionDate: state.sessionDate,
      status: { following: mode === 'follower', speed: state.speed },
      asOf: state.lastTickAt,
      source: SOURCE,
    }
  }

  function refresh() {
    snapshot = buildSnapshot(snapshot)
    listeners.forEach((fn) => fn())
  }


  function ensureSession(t) {
    const key2 = dateKey(t)
    if (key2 > state.sessionDate) rollSession(state, sim, key2, state.lastTickAt)
  }

  function tick(t = now()) {
    const tickMs = SPEEDS[state.speed]
    if (t - state.lastTickAt > tickMs * 3) catchUp(t)
    ensureSession(t)
    stepMarket(state, sim, t)
    state.lastTickAt = t
    refresh()
    persist(t)
  }

  function catchUp(t = now()) {
    const tickMs = SPEEDS[state.speed]
    const elapsed = t - state.lastTickAt
    if (elapsed < tickMs * 2) return 0
    ensureSession(t)
    const n = Math.min(Math.floor(elapsed / tickMs), MAX_CATCHUP_TICKS)
    const from = state.lastTickAt
    for (let i = 1; i <= n; i++) stepMarket(state, sim, from + (elapsed * i) / n)
    state.lastTickAt = t
    refresh()
    persist(t, true)
    return n
  }

  function persist(t = now(), force = false) {
    if (mode !== 'leader') return
    if (!force && t - lastPersistAt < PERSIST_MS) return
    state.savedAt = t
    state.writerId = writerId
    storage.write(key, state)
    lastPersistAt = t
  }


  const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden'

  function stopTimer() {
    if (timer) clearInterval(timer)
    timer = null
  }
  function startTimer() {
    stopTimer()
    if (!started || mode !== 'leader' || hidden()) return
    timer = setInterval(() => tick(), SPEEDS[state.speed])
  }
  function stopWatch() {
    if (watchTimer) clearInterval(watchTimer)
    watchTimer = null
  }
  function startWatch() {
    stopWatch()
    watchTimer = setInterval(() => {
      if (mode === 'follower' && !hidden() && now() - lastForeignWrite > FOLLOWER_TIMEOUT_MS) becomeLeader(now())
    }, WATCH_MS)
  }


  function adopt(data) {
    ensureBase(data.baseEndDate)
    state = data
    refresh()
  }

  function becomeFollower(data, t) {
    mode = 'follower'
    lastForeignWrite = t
    stopTimer()
    adopt(data)
    startWatch()
  }

  function becomeLeader(t) {
    mode = 'leader'
    stopWatch()
    const stored = readStored()
    if (stored && stored.savedAt > state.savedAt) adopt(stored)
    const stepped = catchUp(t)
    if (!stepped) {
      refresh()
      persist(t, true)
    }
    startTimer()
  }

  function evaluateRole() {
    const t = now()
    const stored = readStored()
    if (stored && stored.writerId !== writerId && t - stored.savedAt < FOLLOWER_TIMEOUT_MS) {
      becomeFollower(stored, t)
      return
    }
    becomeLeader(t)
  }

  function onStorage(e) {
    if (e && e.key && e.key !== key) return
    if (!started) return
    const data = readStored()
    if (!data || data.writerId === writerId) return
    const t = now()
    if (mode === 'follower') {
      lastForeignWrite = t
      adopt(data)
      return
    }
    if (data.writerId < writerId) {
      becomeFollower(data, t)
      return
    }
    if (data.controlRev > state.controlRev) {
      state.speed = data.speed
      state.controlRev = data.controlRev
      refresh()
      startTimer()
    }
  }

  function onVisibility() {
    if (hidden()) {
      stopTimer()
      persist(now(), true)
    } else if (started) {
      evaluateRole()
    }
  }
  const onPageHide = () => persist(now(), true)


  function takeControl(change) {
    if (mode === 'follower') {
      mode = 'leader'
      stopWatch()
    }
    change()
    state.controlRev += 1
    refresh()
    persist(now(), true)
    startTimer()
  }


  init()

  function seriesPoints(symbol) {
    const times = state.intraday.times
    const prices = state.intraday.prices[symbol]
    return times.map((t, i) => ({ t, price: prices[i] }))
  }

  return {
    getStocks: () => publicStocks,
    getSnapshot: () => snapshot,
    getQuote: (symbol) => snapshot.quotes[symbol],
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },

    async getHistory(symbol, period) {
      const st = state.stocks[symbol]
      if (!st) throw new Error(`Unknown symbol: ${symbol}`)
      const t = now()
      const current = { t, price: st.price }
      const b = base.map.get(symbol)
      const extra = state.extraDaily[symbol]

      if (period === '1D') {
        const pts = seriesPoints(symbol)
        return pts.length && pts[pts.length - 1].t >= t ? pts : [...pts, current]
      }
      if (period === '1W') {
        const stride = Math.max(1, Math.ceil(state.intraday.times.length / 40))
        const today = seriesPoints(symbol).filter((_, i, a) => i % stride === 0 || i === a.length - 1)
        const cutoff = t - WEEK_MS
        return [...b.hourly, ...extra, ...today].filter((p) => p.t >= cutoff && p.t < t).concat(current)
      }
      const days = PERIOD_DAYS[period]
      if (!days) throw new Error(`Unsupported period: ${period}`)
      const cutoff = t - days * 86_400_000
      return [...b.daily, ...extra].filter((p) => p.t >= cutoff && p.t < t).concat(current)
    },

    async getNews({ symbol, sector, limit = 50 } = {}) {
      const simulated = (state.events ?? [])
        .filter((e) => (symbol ? e.symbol === symbol : sector ? e.sector === sector : true))
        .map((e) => ({
          id: e.id,
          headline: e.headline,
          summary: e.summary,
          symbols: [e.symbol],
          sector: e.sector,
          publishedAt: e.t,
          movePct: e.movePct,
          source: 'Simulated',
        }))
      const sample = getSampleNews({ symbol, sector, limit, now: now() })
      return [...simulated, ...sample].sort((a, b) => b.publishedAt - a.publishedAt).slice(0, limit)
    },

    getSpeedOptions: () => SPEED_OPTIONS,

    start() {
      if (started) return
      started = true
      window.addEventListener('storage', onStorage)
      window.addEventListener('pagehide', onPageHide)
      document.addEventListener('visibilitychange', onVisibility)
      evaluateRole()
    },
    stop() {
      if (!started) return
      persist(now(), true)
      started = false
      stopTimer()
      stopWatch()
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('visibilitychange', onVisibility)
    },
    setSpeed(name) {
      if (!SPEEDS[name]) return
      takeControl(() => (state.speed = name))
    },
    reset(newSeed) {
      takeControl(() => {
        const { speed, controlRev } = state
        state = freshState(newSeed)
        state.speed = speed
        state.controlRev = controlRev
      })
    },

    _internals: {
      tick,
      catchUp,
      onStorage,
      evaluateRole,
      persist,
      getState: () => state,
      getMode: () => mode,
      writerId,
    },
  }
}
