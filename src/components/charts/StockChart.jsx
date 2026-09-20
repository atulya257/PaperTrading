import { lazy, Suspense, useState } from 'react'
import { LineChart } from 'lucide-react'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import ChartTable from './ChartTable.jsx'
import { formatINR } from '../../utils/format.js'
import { DEFAULT_PERIOD, PERIODS } from '../../config/constants.js'
import { useHistory } from '../../hooks/useHistory.js'
import { useThrottledValue } from '../../hooks/useThrottledValue.js'
import './StockChart.css'

const PriceChart = lazy(() => import('./PriceChart.jsx'))

const CHART_REFRESH_MS = 1500

const ChartSkeleton = () => (
  <div className="chart-skeleton">
    <Skeleton height="100%" radius="12px" />
  </div>
)

export default function StockChart({ symbol, prevClose }) {
  const [period, setPeriod] = useState(DEFAULT_PERIOD)
  const { points: livePoints, loading, error, reload } = useHistory(symbol, period)
  const points = useThrottledValue(livePoints, CHART_REFRESH_MS, `${symbol}|${period}`)

  const hasData = points && points.length > 1
  const changePct = hasData ? ((points[points.length - 1].price - points[0].price) / points[0].price) * 100 : null

  let body
  if (error) {
    body = (
      <EmptyState icon={LineChart} tone="error" title="Could not load the chart">
        <button type="button" className="chart-retry" onClick={reload}>
          Try again
        </button>
      </EmptyState>
    )
  } else if (loading && !points) {
    body = <ChartSkeleton />
  } else if (!hasData) {
    body = <EmptyState icon={LineChart} title="Not enough data yet">Price history will appear as the simulation runs.</EmptyState>
  } else {
    body = (
      <Suspense fallback={<ChartSkeleton />}>
        <PriceChart points={points} period={period} prevClose={prevClose} symbol={symbol} />
      </Suspense>
    )
  }

  return (
    <Card
      className="stock-chart"
      title={
        <span className="chart-title">
          Price chart
          {changePct !== null && (
            <span className="chart-period-change">
              <ChangeBadge pct={changePct} /> <span className="chart-period-label">over {period}</span>
            </span>
          )}
        </span>
      }
      actions={<SegmentedControl label="Chart period" options={PERIODS.map((p) => ({ value: p, label: p }))} value={period} onChange={setPeriod} />}
    >
      {body}
      {hasData && <ChartTable points={points} valueKey="price" valueLabel="Simulated price" format={formatINR} caption={`${symbol} simulated price, ${period}`} />}
      <p className="chart-note">Simulated prices — demo data, not real market data.</p>
    </Card>
  )
}
