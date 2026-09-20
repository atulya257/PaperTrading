import { lazy, Suspense, useMemo, useState } from 'react'
import { LineChart } from 'lucide-react'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import ChartTable from '../charts/ChartTable.jsx'
import PnlText from '../stock/PnlText.jsx'
import { useAccount } from '../../context/AccountContext.jsx'
import { useMarketSnapshot } from '../../hooks/useMarketData.js'
import { usePortfolio } from '../../hooks/usePortfolio.js'
import { useThrottledValue } from '../../hooks/useThrottledValue.js'
import { PORTFOLIO_RANGES, sliceValueHistory } from '../../utils/history.js'
import { formatINR } from '../../utils/format.js'
import { safePercent } from '../../utils/money.js'
import './PerformanceCard.css'

const PerformanceChart = lazy(() => import('../charts/PerformanceChart.jsx'))

const MIN_CHART_SPAN_MS = 5_000
const CHART_REFRESH_MS = 2000

export default function PerformanceCard() {
  const { account } = useAccount()
  const { totalValue } = usePortfolio()
  const { asOf } = useMarketSnapshot()
  const [range, setRange] = useState('1D')

  const livePoints = useMemo(() => {
    const saved = sliceValueHistory(account.valueHistory, range, asOf)
    const t = Math.max(asOf, saved[saved.length - 1]?.t ?? 0)
    return [...saved, { t, value: totalValue }]
  }, [account.valueHistory, range, totalValue, asOf])
  const points = useThrottledValue(livePoints, CHART_REFRESH_MS, range)

  const baseline = useMemo(() => {
    if (range === 'ALL') return { value: account.initialCapital, label: `starting capital ${formatINR(account.initialCapital)}` }
    if (range === '1D') return { value: account.dayOpenValue, label: `value at the start of today ${formatINR(account.dayOpenValue)}` }
    return null
  }, [range, account.initialCapital, account.dayOpenValue])

  const first = points[0].value
  const change = totalValue - first
  const flat = points.every((p) => p.value === first)
  const hasSpan = points[points.length - 1].t - points[0].t >= MIN_CHART_SPAN_MS
  const rangeText = PORTFOLIO_RANGES.find((r) => r.value === range).text

  return (
    <Card
      className="performance"
      title={
        <span className="perf-title">
          Portfolio value
          <span className="perf-change">
            <PnlText paise={change} pct={safePercent(change, first)} /> <span className="perf-range-label">{rangeText}</span>
          </span>
        </span>
      }
      actions={<SegmentedControl label="Chart range" options={PORTFOLIO_RANGES.map((r) => ({ value: r.value, label: r.label }))} value={range} onChange={setRange} />}
    >
      {!hasSpan ? (
        <EmptyState icon={LineChart} title="Not enough history yet">
          Your value is sampled as the market moves — the chart appears after a few seconds.
        </EmptyState>
      ) : (
        <Suspense fallback={<div className="perf-skeleton"><Skeleton height="100%" radius="12px" /></div>}>
          <PerformanceChart points={points} range={range} baseline={baseline} />
        </Suspense>
      )}
      {flat && hasSpan && (
        <p className="perf-note">
          Your portfolio value only moves once you hold stocks — buy something and this line will follow the market.
        </p>
      )}
      <ChartTable
        points={points}
        valueKey="value"
        valueLabel="Portfolio value"
        format={formatINR}
        caption={`Portfolio value, ${rangeText}`}
      />
      <p className="perf-note">Simulated prices — demo data. History is saved in this browser.</p>
    </Card>
  )
}
