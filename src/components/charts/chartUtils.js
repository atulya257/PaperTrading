import { formatTime } from '../../utils/format.js'

export const rupeeLabel = (n) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: n < 1000 ? 2 : 0 })}`

const dayMonth = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' })
const monthYear = new Intl.DateTimeFormat('en-IN', { month: 'short', year: '2-digit' })

export function tickLabel(range, t) {
  if (range === '1D' || range === '1H') return formatTime(t)
  return (range === '1Y' || range === '6M' ? monthYear : dayMonth).format(t)
}

export const GRID_STROKE = 'var(--border)'
export const AXIS_TICK = { fill: 'var(--text-faint)', fontSize: 12 }

/** Round axis values (steps of 1, 2 or 5 × 10^n) that cover lo..hi with about `count` gaps. */
export function niceTicks(lo, hi, count = 4) {
  const span = hi - lo || Math.abs(hi) * 0.01 || 1
  const raw = span / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)
  const first = Math.floor(lo / step) * step
  const ticks = []
  for (let v = first; v < hi + step; v += step) ticks.push(Math.round(v * 100) / 100)
  return ticks
}

/** Evenly spaced times between t0 and t1, skipping any whose label would repeat the previous one. */
export function timeTicks(range, t0, t1, count = 5) {
  const ticks = []
  let previous = null
  for (let i = 0; i < count; i++) {
    const t = t0 + ((t1 - t0) * i) / (count - 1)
    const label = tickLabel(range, t)
    if (label !== previous) ticks.push(t)
    previous = label
  }
  return ticks
}

/** The original point under the pointer, from a Recharts mouse/touch event, or null. */
export function pointAtEvent(state, points) {
  const i = Number(state?.activeTooltipIndex)
  return Number.isInteger(i) && points[i] ? points[i] : null
}
