import { formatINR } from '../../utils/format.js'
import './DayRange.css'

export default function DayRange({ label, low, high, price, compact = false }) {
  const span = high - low
  const position = span > 0 ? Math.min(100, Math.max(0, ((price - low) / span) * 100)) : 50
  if (compact) {
    return (
      <div className="range range-compact" aria-hidden="true">
        <div className="range-track">
          <span className="range-marker" style={{ left: `${position}%` }} />
        </div>
      </div>
    )
  }
  return (
    <div className="range" role="group" aria-label={`${label}: low ${formatINR(low)}, high ${formatINR(high)}`}>
      <div className="range-labels">
        <span className="range-caption">{label}</span>
      </div>
      <div className="range-track" aria-hidden="true">
        <span className="range-marker" style={{ left: `${position}%` }} />
      </div>
      <div className="range-values num">
        <span>{formatINR(low)}</span>
        <span>{formatINR(high)}</span>
      </div>
    </div>
  )
}
