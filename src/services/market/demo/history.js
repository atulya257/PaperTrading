import { createRng, hashString } from './rng.js'
import { SIM, idioDailyVol, roundToTick } from './simulator.js'
import { atTime, tradingDaysEndingAt } from './dates.js'

export const DAILY_POINTS = 250
export const HOURLY_DAYS = 5
export const HOURS_PER_DAY = 7

export function generateBaseHistory(stock, endPrice, endDateKey) {
  const { beta, sectorLoad, dailyVol } = stock.sim
  const marketRng = createRng(hashString('market'))
  const sectorRng = createRng(hashString(`sector:${stock.sector}`))
  const ownRng = createRng(hashString(`stock:${stock.symbol}`))

  const idio = idioDailyVol(stock.sim)
  const ownDrift = (ownRng.next() - 0.5) * 0.0016
  const sectorDrift = (createRng(hashString(`drift:${stock.sector}`)).next() - 0.5) * 0.0008

  const path = new Array(DAILY_POINTS)
  let level = 0
  for (let k = 0; k < DAILY_POINTS; k++) {
    const marketWave = 0.0005 * Math.sin(k / 19)
    const r =
      ownDrift +
      sectorDrift +
      beta * (SIM.MARKET_DAILY_VOL * marketRng.gauss() + marketWave) +
      sectorLoad * SIM.SECTOR_DAILY_VOL * sectorRng.gauss() +
      idio * ownRng.gauss()
    level += r
    path[k] = level
  }

  const days = tradingDaysEndingAt(endDateKey, DAILY_POINTS)
  const last = path[DAILY_POINTS - 1]
  const daily = days.map((key, k) => ({
    t: atTime(key, 15, 30),
    price: k === DAILY_POINTS - 1 ? endPrice : roundToTick(endPrice * Math.exp(path[k] - last)),
  }))

  const hourly = []
  for (let d = DAILY_POINTS - HOURLY_DAYS; d < DAILY_POINTS; d++) {
    const from = Math.log(daily[d - 1].price)
    const to = Math.log(daily[d].price)
    const steps = new Array(HOURS_PER_DAY)
    let w = 0
    for (let i = 0; i < HOURS_PER_DAY; i++) {
      w += (dailyVol * 0.9 * ownRng.gauss()) / Math.sqrt(HOURS_PER_DAY)
      steps[i] = w
    }
    const total = steps[HOURS_PER_DAY - 1]
    for (let i = 0; i < HOURS_PER_DAY; i++) {
      const f = (i + 1) / HOURS_PER_DAY
      const logPrice = from + (to - from) * f + (steps[i] - f * total)
      const price = i === HOURS_PER_DAY - 1 ? daily[d].price : roundToTick(Math.exp(logPrice))
      hourly.push({ t: atTime(days[d], 9, 15) + i * 3_600_000, price })
    }
  }

  let high = -Infinity
  let low = Infinity
  for (const p of daily) {
    if (p.price > high) high = p.price
    if (p.price < low) low = p.price
  }
  return { daily, hourly, high, low }
}
