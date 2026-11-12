import { useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatPercent, formatTime, paiseToRupees } from '../../utils/format.js'
import { AXIS_TICK, GRID_STROKE, niceTicks, pointAtEvent, rupeeLabel, tickLabel } from './chartUtils.js'
import './PriceChart.css'

function ChartTooltip({ active, payload, period, first }) {
  if (!active || !payload?.length) return null
  const { t, price } = payload[0].payload
  const change = first ? ((price - first) / first) * 100 : 0
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-price num">{rupeeLabel(price)}</p>
      <p className={`chart-tooltip-change num ${change > 0 ? 'gain' : change < 0 ? 'loss' : 'flat'}`}>
        {formatPercent(change)} vs start
      </p>
      <p className="chart-tooltip-time">{period === '1D' ? formatTime(t) : `${formatDate(t)}${period === '1W' ? `, ${formatTime(t)}` : ''}`}</p>
    </div>
  )
}

const periodTime = (period, t) => (period === '1D' ? formatTime(t) : `${formatDate(t)}${period === '1W' ? `, ${formatTime(t)}` : ''}`)

/** While scrubbing, the big price above the chart shows the value, so the tooltip only names the time. */
function TimeTooltip({ active, payload, period }) {
  if (!active || !payload?.length) return null
  return <div className="chart-time">{periodTime(period, payload[0].payload.t)}</div>
}

export default function PriceChart({ points, period, prevClose, symbol, onScrub }) {
  const gradientId = `fill-${useId().replace(/:/g, '')}`

  const { data, ticks, domain, first, last, color } = useMemo(() => {
    const rows = points.map((p) => ({ t: p.t, price: paiseToRupees(p.price) }))
    const firstPrice = rows[0].price
    const lastPrice = rows[rows.length - 1].price
    let lo = Math.min(...rows.map((r) => r.price))
    let hi = Math.max(...rows.map((r) => r.price))
    if (period === '1D' && prevClose) {
      const pc = paiseToRupees(prevClose)
      lo = Math.min(lo, pc)
      hi = Math.max(hi, pc)
    }
    const pad = Math.max((hi - lo) * 0.12, hi * 0.0015)
    const ticks = niceTicks(Math.max(0, lo - pad), hi + pad)
    return {
      data: rows,
      ticks,
      domain: [ticks[0], ticks[ticks.length - 1]],
      first: firstPrice,
      last: lastPrice,
      color: lastPrice >= firstPrice ? 'var(--gain)' : 'var(--loss)',
    }
  }, [points, period, prevClose])

  const summary = `${symbol} price over ${period}: from ${rupeeLabel(first)} to ${rupeeLabel(last)}, ${formatPercent(((last - first) / first) * 100)}. Simulated data.`

  return (
    <div className="chart-frame" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          onMouseMove={onScrub ? (state) => onScrub(pointAtEvent(state, points)) : undefined}
          onMouseLeave={onScrub ? () => onScrub(null) : undefined}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.16 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(t) => tickLabel(period, t)}
            tickLine={false}
            axisLine={false}
            minTickGap={56}
            tick={AXIS_TICK}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={domain}
            orientation="right"
            tickFormatter={rupeeLabel}
            tickLine={false}
            axisLine={false}
            width={68}
            ticks={ticks}
            tick={AXIS_TICK}
          />
          {period === '1D' && prevClose ? (
            <ReferenceLine y={paiseToRupees(prevClose)} stroke="var(--text-faint)" strokeDasharray="4 4" />
          ) : null}
          <Tooltip
            content={onScrub ? <TimeTooltip period={period} /> : <ChartTooltip period={period} first={first} />}
            cursor={{ stroke: 'var(--text)', strokeWidth: 1 }}
            position={onScrub ? { y: 0 } : undefined}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2.25}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, stroke: 'var(--surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
