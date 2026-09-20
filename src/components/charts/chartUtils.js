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
