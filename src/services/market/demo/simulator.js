
import { createRng } from './rng.js'

export const SIM = {
  TICKS_PER_DAY: 600,
  TICK_PAISE: 5,
  BAND: 0.1,

  MARKET_DAILY_VOL: 0.0065,
  SECTOR_DAILY_VOL: 0.0045,
  SECTOR_PERSISTENCE: 0.7,
  MOMENTUM: 0.08,
  SPREAD_MULT: 1.2,

  MOOD_PERSISTENCE: 0.999,
  MOOD_INNOVATION: 0.028,
  DAY_BIAS: 0.01,

  MARKET_VOL_PERSISTENCE: 0.98,
  STOCK_VOL_PERSISTENCE: 0.97,
  VOL_MIN: 0.6,
  VOL_MAX: 2.0,

  INTRADAY_EVERY: 5,
  INTRADAY_MAX: 480,
  EXTRA_DAILY_MAX: 400,

  EVENT_PROB: 1 / 240,
  EVENT_MIN_SIGMA: 0.6,
  EVENT_MAX_SIGMA: 1.6,
  EVENTS_MAX: 40,
}

const E_ABS = Math.sqrt(2 / Math.PI)
const perTick = (daily) => daily / Math.sqrt(SIM.TICKS_PER_DAY)
const MARKET_TICK = perTick(SIM.MARKET_DAILY_VOL)
const SECTOR_INNOVATION =
  perTick(SIM.SECTOR_DAILY_VOL) * Math.sqrt((1 - SIM.SECTOR_PERSISTENCE) / (1 + SIM.SECTOR_PERSISTENCE))
const REVERSION = 1 / (2 * SIM.TICKS_PER_DAY * SIM.SPREAD_MULT ** 2)

const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x)
export const roundToTick = (paise) => Math.max(SIM.TICK_PAISE, Math.round(paise / SIM.TICK_PAISE) * SIM.TICK_PAISE)

export function idioDailyVol({ dailyVol, beta, sectorLoad }) {
  const explained = (beta * SIM.MARKET_DAILY_VOL) ** 2 + (sectorLoad * SIM.SECTOR_DAILY_VOL) ** 2
  return Math.sqrt(Math.max(dailyVol ** 2 - explained, (0.55 * dailyVol) ** 2))
}

export function buildSimMeta(stocks) {
  const list = stocks.map((s) => ({
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    beta: s.sim.beta,
    sectorLoad: s.sim.sectorLoad,
    idioTick: perTick(idioDailyVol(s.sim)),
    dailyVol: s.sim.dailyVol,
    weight: s.marketCapCr,
    basePrice: s.basePrice,
  }))
  const total = list.reduce((sum, s) => sum + s.weight, 0)
  list.forEach((s) => (s.weight /= total))
  return { list, sectors: [...new Set(list.map((s) => s.sector))].sort() }
}

export function createInitialState({ seed, now, sessionDate, baseEndDate, sim, base }) {
  const stocks = {}
  for (const s of sim.list) {
    stocks[s.symbol] = {
      truePrice: s.basePrice,
      price: s.basePrice,
      prevClose: s.basePrice,
      dayHigh: s.basePrice,
      dayLow: s.basePrice,
      high52: Math.max(base[s.symbol].high, s.basePrice),
      low52: Math.min(base[s.symbol].low, s.basePrice),
      lastReturn: 0,
      vol: 1,
    }
  }
  return {
    v: 1,
    seed,
    rngState: seed >>> 0,
    sessionDate,
    baseEndDate,
    tickCount: 0,
    lastTickAt: now,
    savedAt: 0,
    writerId: '',
    controlRev: 0,
    speed: 'normal',
    mood: 0,
    volRegime: 1,
    sectorFactors: Object.fromEntries(sim.sectors.map((k) => [k, 0])),
    stocks,
    intraday: {
      every: SIM.INTRADAY_EVERY,
      sinceLast: 0,
      times: [now],
      prices: Object.fromEntries(sim.list.map((s) => [s.symbol, [s.basePrice]])),
    },
    extraDaily: Object.fromEntries(sim.list.map((s) => [s.symbol, []])),
    events: [],
  }
}

export function stepMarket(state, sim, t) {
  const rng = createRng(state.rngState)
  const z = rng.gauss

  state.mood = clamp(SIM.MOOD_PERSISTENCE * state.mood + SIM.MOOD_INNOVATION * z(), -1, 1)
  const em = z()
  state.volRegime = clamp(
    SIM.MARKET_VOL_PERSISTENCE * state.volRegime + (1 - SIM.MARKET_VOL_PERSISTENCE) * (1 + (Math.abs(em) - E_ABS)),
    SIM.VOL_MIN,
    SIM.VOL_MAX,
  )
  const m = MARKET_TICK * state.volRegime * em

  for (const k of sim.sectors) {
    state.sectorFactors[k] = SIM.SECTOR_PERSISTENCE * state.sectorFactors[k] + SECTOR_INNOVATION * z()
  }

  for (const s of sim.list) {
    const st = state.stocks[s.symbol]
    const e = z()
    st.vol = clamp(
      SIM.STOCK_VOL_PERSISTENCE * st.vol + (1 - SIM.STOCK_VOL_PERSISTENCE) * (1 + 1.2 * (Math.abs(e) - E_ABS)),
      SIM.VOL_MIN,
      SIM.VOL_MAX,
    )
    const fairValue = st.prevClose * (1 + state.mood * SIM.DAY_BIAS * s.beta)
    const r =
      s.beta * m +
      s.sectorLoad * state.sectorFactors[s.sector] +
      s.idioTick * st.vol * e +
      SIM.MOMENTUM * st.lastReturn -
      REVERSION * Math.log(st.truePrice / fairValue)

    let next = st.truePrice * Math.exp(r)
    const lo = st.prevClose * (1 - SIM.BAND)
    const hi = st.prevClose * (1 + SIM.BAND)
    if (next <= lo || next >= hi) {
      next = clamp(next, lo, hi)
      st.lastReturn = 0
    } else {
      st.lastReturn = r
    }
    st.truePrice = next
    st.price = roundToTick(next)
    if (st.price > st.dayHigh) st.dayHigh = st.price
    if (st.price < st.dayLow) st.dayLow = st.price
    if (st.price > st.high52) st.high52 = st.price
    if (st.price < st.low52) st.low52 = st.price
  }

  state.tickCount += 1
  maybeTriggerEvent(state, sim, rng, t)
  state.rngState = rng.getState()
  sampleIntraday(state, sim, t)
  return state
}

const UP_REASONS = ['strong order inflows', 'upbeat analyst commentary', 'better-than-expected demand', 'buying interest from funds', 'a positive business update']
const DOWN_REASONS = ['profit booking', 'cautious analyst commentary', 'a weaker demand outlook', 'selling pressure from funds', 'a soft business update']

function maybeTriggerEvent(state, sim, rng, t) {
  if (rng.next() >= SIM.EVENT_PROB) return
  const s = sim.list[Math.floor(rng.next() * sim.list.length)]
  const direction = rng.next() < 0.5 ? -1 : 1
  const sigmas = SIM.EVENT_MIN_SIGMA + rng.next() * (SIM.EVENT_MAX_SIGMA - SIM.EVENT_MIN_SIGMA)
  const reasons = direction > 0 ? UP_REASONS : DOWN_REASONS
  const reason = reasons[Math.floor(rng.next() * reasons.length)]

  const st = state.stocks[s.symbol]
  const before = st.price
  const lo = st.prevClose * (1 - SIM.BAND)
  const hi = st.prevClose * (1 + SIM.BAND)
  st.truePrice = clamp(st.truePrice * Math.exp(direction * sigmas * s.dailyVol), lo, hi)
  st.price = roundToTick(st.truePrice)
  if (st.price > st.dayHigh) st.dayHigh = st.price
  if (st.price < st.dayLow) st.dayLow = st.price
  if (st.price > st.high52) st.high52 = st.price
  if (st.price < st.low52) st.low52 = st.price

  const movePct = Math.round(((st.price - before) / before) * 1000) / 10
  const verb = direction > 0 ? 'rise' : 'slip'
  state.events.push({
    id: `sim-${state.tickCount}-${s.symbol}`,
    t,
    symbol: s.symbol,
    sector: s.sector,
    movePct,
    headline: `${s.name} shares ${verb} on ${reason}`,
    summary: `A simulated move of about ${Math.abs(movePct).toFixed(1)}%. This headline was generated by the TradeLab demo simulator — it is not a real news report.`,
  })
  if (state.events.length > SIM.EVENTS_MAX) state.events.splice(0, state.events.length - SIM.EVENTS_MAX)
}

function sampleIntraday(state, sim, t) {
  const book = state.intraday
  book.sinceLast += 1
  if (book.sinceLast < book.every) return
  book.sinceLast = 0
  book.times.push(t)
  for (const s of sim.list) book.prices[s.symbol].push(state.stocks[s.symbol].price)

  if (book.times.length > SIM.INTRADAY_MAX) {
    const keep = (_, i) => i % 2 === 0 || i === book.times.length - 1
    book.times = book.times.filter(keep)
    for (const s of sim.list) book.prices[s.symbol] = book.prices[s.symbol].filter(keep)
    book.every *= 2
  }
}

export function rollSession(state, sim, newSessionDate, closeTime) {
  for (const s of sim.list) {
    const st = state.stocks[s.symbol]
    const list = state.extraDaily[s.symbol]
    list.push({ t: closeTime, price: st.price })
    if (list.length > SIM.EXTRA_DAILY_MAX) list.splice(0, list.length - SIM.EXTRA_DAILY_MAX)
    st.prevClose = st.price
    st.dayHigh = st.price
    st.dayLow = st.price
  }
  state.sessionDate = newSessionDate
  state.intraday = {
    every: SIM.INTRADAY_EVERY,
    sinceLast: 0,
    times: [closeTime],
    prices: Object.fromEntries(sim.list.map((s) => [s.symbol, [state.stocks[s.symbol].price]])),
  }
  return state
}


const INDEX_BASE = 1000

export function computeIndex(state, sim) {
  let now = 0
  let prev = 0
  for (const s of sim.list) {
    const st = state.stocks[s.symbol]
    now += (s.weight * st.price) / s.basePrice
    prev += (s.weight * st.prevClose) / s.basePrice
  }
  const value = Math.round(now * INDEX_BASE * 100) / 100
  const prevClose = Math.round(prev * INDEX_BASE * 100) / 100
  const change = Math.round((value - prevClose) * 100) / 100
  return { value, prevClose, change, changePct: prevClose ? (change / prevClose) * 100 : 0 }
}

export function observedMood(indexChangePct, breadth) {
  const counted = breadth.advancers + breadth.decliners + breadth.unchanged || 1
  const breadthScore = (breadth.advancers - breadth.decliners) / counted
  const indexScore = clamp(indexChangePct / 0.6, -1, 1)
  return clamp(0.6 * indexScore + 0.4 * breadthScore, -1, 1)
}

export function moodLabel(mood) {
  if (mood < -0.45) return 'Bearish'
  if (mood < -0.15) return 'Cautious'
  if (mood <= 0.15) return 'Neutral'
  if (mood <= 0.45) return 'Optimistic'
  return 'Bullish'
}

export function computeBreadth(state, sim) {
  let advancers = 0
  let decliners = 0
  for (const s of sim.list) {
    const st = state.stocks[s.symbol]
    if (st.price > st.prevClose) advancers++
    else if (st.price < st.prevClose) decliners++
  }
  return { advancers, decliners, unchanged: sim.list.length - advancers - decliners }
}

export function isValidMarketState(data, sim) {
  try {
    if (!data || data.v !== 1) return false
    if (!Number.isFinite(data.rngState) || !Number.isFinite(data.mood) || !Number.isFinite(data.volRegime)) return false
    if (typeof data.sessionDate !== 'string' || typeof data.baseEndDate !== 'string') return false
    if (!Number.isFinite(data.lastTickAt) || !data.stocks || !data.intraday || !data.extraDaily) return false
    const n = data.intraday.times?.length
    if (!Array.isArray(data.intraday.times) || n < 1) return false
    for (const s of sim.list) {
      const st = data.stocks[s.symbol]
      if (!st) return false
      for (const f of ['truePrice', 'price', 'prevClose', 'dayHigh', 'dayLow', 'high52', 'low52', 'lastReturn', 'vol']) {
        if (!Number.isFinite(st[f])) return false
      }
      if (st.price <= 0 || st.prevClose <= 0 || st.truePrice <= 0) return false
      if (data.intraday.prices?.[s.symbol]?.length !== n) return false
      if (!Array.isArray(data.extraDaily[s.symbol])) return false
    }
    for (const k of sim.sectors) if (!Number.isFinite(data.sectorFactors?.[k])) return false
    if (data.events !== undefined) {
      if (!Array.isArray(data.events)) return false
      const okEvent = (e) => e && typeof e.id === 'string' && typeof e.symbol === 'string' && typeof e.headline === 'string' && Number.isFinite(e.t)
      if (!data.events.every(okEvent)) return false
    }
    return true
  } catch {
    return false
  }
}
