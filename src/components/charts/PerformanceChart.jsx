import { useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate, formatPercent, formatTime, paiseToRupees } from '../../utils/format.js'
import { AXIS_TICK, GRID_STROKE, rupeeLabel, tickLabel } from './chartUtils.js'
import './PriceChart.css'

function PerformanceTooltip({ active, payload, first, baselineLabel }) {
  if (!active || !payload?.length) return null
  const { t, value } = payload[0].payload
  const change = first ? ((value - first) / first) * 100 : 0
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-price num">{rupeeLabel(value)}</p>
      <p className={`chart-tooltip-change num ${change > 0 ? 'gain' : change < 0 ? 'loss' : 'flat'}`}>
        {formatPercent(change)} vs range start
      </p>
      <p className="chart-tooltip-time">
        {formatDate(t)}, {formatTime(t)}
      </p>
      {baselineLabel && <p className="chart-tooltip-time">Dashed line: {baselineLabel}</p>}
    </div>
  )
}

export default function PerformanceChart({ points, range, baseline }) {
  const gradientId = `perf-${useId().replace(/:/g, '')}`

  const { data, domain, first, last, color } = useMemo(() => {
    const rows = points.map((p) => ({ t: p.t, value: paiseToRupees(p.value) }))
    const firstValue = rows[0].value
    const lastValue = rows[rows.length - 1].value
    let lo = Math.min(...rows.map((r) => r.value))
    let hi = Math.max(...rows.map((r) => r.value))
    if (baseline) {
      const b = paiseToRupees(baseline.value)
      lo = Math.min(lo, b)
      hi = Math.max(hi, b)
    }
    const pad = Math.max((hi - lo) * 0.15, hi * 0.0005)
    return {
      data: rows,
      domain: [Math.max(0, lo - pad), hi + pad],
      first: firstValue,
      last: lastValue,
      color: lastValue >= firstValue ? 'var(--gain)' : 'var(--loss)',
    }
  }, [points, baseline])

  const summary = `Portfolio value over the selected range: from ${rupeeLabel(first)} to ${rupeeLabel(last)}, ${formatPercent(((last - first) / first) * 100)}. Simulated data.`

  return (
    <div className="chart-frame" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.28 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(t) => tickLabel(range, t)}
            tickLine={false}
            axisLine={false}
            minTickGap={64}
            tick={AXIS_TICK}
          />
          <YAxis
            domain={domain}
            orientation="right"
            tickFormatter={rupeeLabel}
            tickLine={false}
            axisLine={false}
            width={76}
            tickCount={5}
            tick={AXIS_TICK}
          />
          {baseline && <ReferenceLine y={paiseToRupees(baseline.value)} stroke="var(--text-faint)" strokeDasharray="4 4" />}
          <Tooltip
            content={<PerformanceTooltip first={first} baselineLabel={baseline?.label} />}
            cursor={{ stroke: 'var(--text-faint)' }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
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
