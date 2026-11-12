import { lazy, Suspense, useMemo, useState } from 'react'
import Skeleton from '../ui/Skeleton.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import ChartTable from '../charts/ChartTable.jsx'
import PnlText from '../stock/PnlText.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { useMarketSnapshot } from '../../hooks/useMarketData.js'
import { useThrottledValue } from '../../hooks/useThrottledValue.js'
import { PORTFOLIO_RANGES, sliceValueHistory } from '../../utils/history.js'
import { formatDate, formatINR, formatTime } from '../../utils/format.js'
import { safePercent } from '../../utils/money.js'
import './PortfolioHero.css'

const PerformanceChart = lazy(() => import('../charts/PerformanceChart.jsx'))

const MIN_CHART_SPAN_MS = 5_000
const CHART_REFRESH_MS = 2000

export default function PortfolioHero({ portfolio: p, greeting }) {
  const { account } = useAccount()
  const { asOf } = useMarketSnapshot()
  const [range, setRange] = useState('1D')
  const [scrub, setScrub] = useState(null)

  const livePoints = useMemo(() => {
    const saved = sliceValueHistory(account.valueHistory, range, asOf)
    const t = Math.max(asOf, saved[saved.length - 1]?.t ?? 0)
    return [...saved, { t, value: p.totalValue }]
  }, [account.valueHistory, range, p.totalValue, asOf])
  const points = useThrottledValue(livePoints, CHART_REFRESH_MS, range)

  const baseline = useMemo(() => {
    if (range === 'ALL') return { value: account.initialCapital, label: `starting capital ${formatINR(account.initialCapital)}` }
    if (range === '1D') return { value: account.dayOpenValue, label: `value at the start of today ${formatINR(account.dayOpenValue)}` }
    return null
  }, [range, account.initialCapital, account.dayOpenValue])

  const first = points[0].value
  const shown = scrub ? scrub.value : p.totalValue
  const change = shown - first
  const hasSpan = points[points.length - 1].t - points[0].t >= MIN_CHART_SPAN_MS
  const flat = points.every((pt) => pt.value === first)
  const rangeText = PORTFOLIO_RANGES.find((r) => r.value === range).text

  const changeRange = (next) => {
    setRange(next)
    setScrub(null)
  }

  return (
    <section className="phero" aria-label="Portfolio value">
      <div className="phero-head">
        <div className="phero-figures">
          <p className="phero-label">{scrub ? `${formatDate(scrub.t)}, ${formatTime(scrub.t)}` : greeting ?? 'Portfolio value'}</p>
          <p className={`phero-value num${scrub ? ' is-scrubbing' : ''}`}>{formatINR(shown)}</p>
          <p className="phero-change">
            <PnlText paise={change} pct={safePercent(change, first)} />
            <span className="phero-range">{scrub ? `since the start of the range` : rangeText}</span>
          </p>
        </div>
        <SegmentedControl
          label="Chart range"
          options={PORTFOLIO_RANGES.map((r) => ({ value: r.value, label: r.label }))}
          value={range}
          onChange={changeRange}
        />
      </div>

      <div className="phero-chart">
        {hasSpan ? (
          <Suspense fallback={<Skeleton height="100%" radius="var(--radius-sm)" />}>
            <div key={range} className="chart-fade">
              <PerformanceChart points={points} range={range} baseline={baseline} onScrub={setScrub} />
            </div>
          </Suspense>
        ) : (
          <p className="phero-wait">The chart starts drawing a few seconds after you open TradeLab, as the market moves.</p>
        )}
      </div>
      {flat && hasSpan && <p className="phero-note">The line stays flat while you only hold cash. Buy a stock and it starts following the market.</p>}

      <dl className="phero-stats">
        <div>
          <dt>Cash</dt>
          <dd className="num">{formatINR(p.cash)}</dd>
        </div>
        <div>
          <dt>Invested</dt>
          <dd className="num">{formatINR(p.invested)}</dd>
        </div>
        <div>
          <dt>Current value</dt>
          <dd className="num">{formatINR(p.marketValue)}</dd>
        </div>
        <div>
          <dt>Unrealized P&amp;L</dt>
          <dd>
            <PnlText paise={p.unrealizedPnl} pct={p.unrealizedPnlPct} />
          </dd>
        </div>
        <div>
          <dt>Realized P&amp;L</dt>
          <dd>
            <PnlText paise={p.realizedPnl} />
          </dd>
        </div>
      </dl>

      <ChartTable points={points} valueKey="value" valueLabel="Portfolio value" format={formatINR} caption={`Portfolio value, ${rangeText}`} />
    </section>
  )
}
