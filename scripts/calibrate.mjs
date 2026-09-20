import { STOCKS } from '../src/services/market/demo/stocks.js'
import {
  SIM,
  buildSimMeta,
  createInitialState,
  computeIndex,
  moodLabel,
  rollSession,
  stepMarket,
} from '../src/services/market/demo/simulator.js'

const TICKS = Number(process.argv[2] ?? 100_000)
const SEED = Number(process.argv[3] ?? 12345)
const ROLL_EVERY = Number(process.argv[4] ?? 0)

const sim = buildSimMeta(STOCKS)
const base = Object.fromEntries(STOCKS.map((s) => [s.symbol, { high: s.basePrice, low: s.basePrice }]))
const state = createInitialState({ seed: SEED, now: 0, sessionDate: '2026-01-01', baseEndDate: '2025-12-31', sim, base })

const n = sim.list.length
const W = SIM.TICKS_PER_DAY
const SHORT = 60

const pct = (arr, p) => {
  const a = [...arr].sort((x, y) => x - y)
  return a[Math.min(a.length - 1, Math.floor((p / 100) * a.length))]
}
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length
const std = (a) => {
  const m = mean(a)
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)))
}
const corr = (a, b) => {
  const ma = mean(a)
  const mb = mean(b)
  let sab = 0
  let saa = 0
  let sbb = 0
  for (let i = 0; i < a.length; i++) {
    sab += (a[i] - ma) * (b[i] - mb)
    saa += (a[i] - ma) ** 2
    sbb += (b[i] - mb) ** 2
  }
  return sab / Math.sqrt(saa * sbb)
}

const windowReturns = sim.list.map(() => [])
const shortReturns = sim.list.map(() => [])
const indexShort = []
const dayChange = []
const unchangedTicks = new Array(n).fill(0)
const lag1num = new Array(n).fill(0)
const lag1den = new Array(n).fill(0)
const prevTickRet = new Array(n).fill(0)
let bandHits = 0
let offTick = 0
let bad = 0
const moodCount = {}
let lastW = sim.list.map((s) => Math.log(state.stocks[s.symbol].truePrice))
let lastS = [...lastW]
let lastIdx = computeIndex(state, sim).value
let prevPrice = sim.list.map((s) => state.stocks[s.symbol].price)

const t0 = Date.now()
for (let k = 1; k <= TICKS; k++) {
  if (ROLL_EVERY && k % ROLL_EVERY === 0) rollSession(state, sim, `d${k}`, k)
  stepMarket(state, sim, k)
  const lab = moodLabel(state.mood)
  moodCount[lab] = (moodCount[lab] ?? 0) + 1

  sim.list.forEach((s, i) => {
    const st = state.stocks[s.symbol]
    if (!Number.isFinite(st.price) || !Number.isFinite(st.truePrice) || st.price <= 0) bad++
    if (st.price % SIM.TICK_PAISE !== 0) offTick++
    if (st.price === prevPrice[i]) unchangedTicks[i]++
    prevPrice[i] = st.price
    if (Math.abs(st.truePrice / st.prevClose - 1) >= SIM.BAND - 1e-9) bandHits++
    const lp = Math.log(st.truePrice)
    if (k > W) dayChange.push((st.price / st.prevClose - 1) * 100)

    const tr = st.lastReturn
    lag1num[i] += tr * prevTickRet[i]
    lag1den[i] += tr * tr
    prevTickRet[i] = tr

    if (k % W === 0) {
      windowReturns[i].push(lp - lastW[i])
      lastW[i] = lp
    }
    if (k % SHORT === 0) {
      shortReturns[i].push(lp - lastS[i])
      lastS[i] = lp
    }
  })
  if (k % SHORT === 0) {
    const v = computeIndex(state, sim).value
    indexShort.push(Math.log(v / lastIdx))
    lastIdx = v
  }
}
const secs = ((Date.now() - t0) / 1000).toFixed(2)

console.log(`\n=== TradeLab simulator calibration: ${TICKS} ticks, seed ${SEED}, rollover every ${ROLL_EVERY || 'never'} (${secs}s) ===`)
console.log(`NaN/invalid prices: ${bad}   off-tick prices: ${offTick}   band-limit ticks: ${bandHits} (${((100 * bandHits) / (TICKS * n)).toFixed(4)}%)`)

const ratios = sim.list.map((s, i) => std(windowReturns[i]) / s.dailyVol)
console.log(`\nRealised 600-tick return std / target daily vol:  mean ${mean(ratios).toFixed(2)}  min ${Math.min(...ratios).toFixed(2)}  max ${Math.max(...ratios).toFixed(2)}`)

const abs = dayChange.map(Math.abs)
console.log(
  `Day change vs prevClose (%):  p50|x| ${pct(abs, 50).toFixed(2)}  p90|x| ${pct(abs, 90).toFixed(2)}  p99|x| ${pct(abs, 99).toFixed(2)}  max|x| ${abs.reduce((m, x) => (x > m ? x : m), 0).toFixed(2)}  mean ${mean(dayChange).toFixed(3)}`,
)

const pairs = { same: [], cross: [] }
for (let i = 0; i < n; i++) {
  for (let j = i + 1; j < n; j++) {
    const c = corr(shortReturns[i], shortReturns[j])
    ;(sim.list[i].sector === sim.list[j].sector ? pairs.same : pairs.cross).push(c)
  }
}
const withIndex = sim.list.map((_, i) => corr(shortReturns[i], indexShort))
console.log(`\nCorrelation (60-tick returns):  same-sector ${mean(pairs.same).toFixed(2)}   cross-sector ${mean(pairs.cross).toFixed(2)}   vs index ${mean(withIndex).toFixed(2)}`)

const flat = mean(unchangedTicks.map((u) => u / TICKS)) * 100
const cheapest = sim.list.map((s, i) => ({ s: s.symbol, p: (unchangedTicks[i] / TICKS) * 100 })).sort((a, b) => b.p - a.p)[0]
console.log(`Ticks with no visible price change:  avg ${flat.toFixed(1)}%   worst ${cheapest.s} ${cheapest.p.toFixed(1)}%`)
const ac = sim.list.map((_, i) => lag1num[i] / lag1den[i])
console.log(`Lag-1 autocorrelation of tick returns (momentum):  avg ${mean(ac).toFixed(3)}`)

const total = Object.values(moodCount).reduce((a, b) => a + b, 0)
console.log(
  'Mood distribution: ' +
    Object.entries(moodCount)
      .map(([k, v]) => `${k} ${((100 * v) / total).toFixed(0)}%`)
      .join('  '),
)

console.log('\nFinal prices vs previous close:')
for (const sym of ['RELIANCE', 'TCS', 'TATASTEEL', 'MARUTI']) {
  const st = state.stocks[sym]
  console.log(`  ${sym.padEnd(10)} ₹${(st.price / 100).toFixed(2)}  (${((st.price / st.prevClose - 1) * 100).toFixed(2)}%)  day range ₹${(st.dayLow / 100).toFixed(2)}–₹${(st.dayHigh / 100).toFixed(2)}`)
}
