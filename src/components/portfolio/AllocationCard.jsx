import { useState } from 'react'
import { PieChart } from 'lucide-react'
import Card from '../ui/Card.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import SegmentedControl from '../ui/SegmentedControl.jsx'
import { foldAllocation } from '../../engine/finance.js'
import { formatINR } from '../../utils/format.js'
import './AllocationCard.css'

const VIEWS = [
  { value: 'byHolding', label: 'Holdings' },
  { value: 'bySector', label: 'Sectors' },
]
const MAX_ROWS = 8

export default function AllocationCard({ allocation, hasHoldings }) {
  const [view, setView] = useState('byHolding')

  const cashPct = allocation.byHolding.find((i) => i.key === 'CASH')?.pct ?? 0
  const investedPct = allocation.byHolding.filter((i) => i.key !== 'CASH').reduce((sum, i) => sum + i.pct, 0)
  const rows = foldAllocation(allocation[view].filter((i) => i.key !== 'CASH'), MAX_ROWS)

  return (
    <Card
      className="allocation"
      title="Allocation"
      actions={
        hasHoldings ? (
          <SegmentedControl label="Group allocation by" options={VIEWS} value={view} onChange={setView} />
        ) : null
      }
    >
      {!hasHoldings ? (
        <EmptyState icon={PieChart} title="All cash for now">
          Your allocation appears once you own stocks. Right now 100% of your portfolio is cash.
        </EmptyState>
      ) : (
        <>
          <div className="mix">
            <div
              className="mix-track"
              role="img"
              aria-label={`${investedPct.toFixed(1)}% invested in stocks, ${cashPct.toFixed(1)}% in cash`}
            >
              <span className="mix-invested" style={{ width: `${Math.max(investedPct, 0.8)}%` }} />
            </div>
            <p className="mix-legend">
              <span>
                <i className="dot invested" aria-hidden="true" /> Invested <strong className="num">{investedPct.toFixed(1)}%</strong>
              </span>
              <span>
                <i className="dot cash" aria-hidden="true" /> Cash <strong className="num">{cashPct.toFixed(1)}%</strong>
              </span>
            </p>
          </div>

          <p className="alloc-caption">Share of your invested money</p>
          <ul className="alloc-list" aria-label={`Invested money by ${view === 'byHolding' ? 'holding' : 'sector'}`}>
            {rows.map((r) => (
              <li key={r.key} className="alloc-row">
                <div className="alloc-head">
                  <span className="alloc-label">{r.label}</span>
                  <span className="alloc-values num">
                    <span className="alloc-amount">{formatINR(r.value)}</span>
                    <strong>{r.pctOfHoldings.toFixed(1)}%</strong>
                  </span>
                </div>
                <div className="alloc-track" aria-hidden="true">
                  <span
                    className={`alloc-bar${r.key === 'OTHER' ? ' other' : ''}`}
                    style={{ width: `${Math.max(r.pctOfHoldings, 0.8)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
