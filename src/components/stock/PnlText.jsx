import { formatSignedINR, trendOf } from '../../utils/format.js'
import ChangeBadge from './ChangeBadge.jsx'
import './PnlText.css'

export default function PnlText({ paise, pct, className = '' }) {
  const trend = trendOf(paise)
  return (
    <span className={`pnl ${trend}${className ? ` ${className}` : ''}`}>
      <span className="num">{formatSignedINR(paise)}</span>
      {pct !== undefined && <ChangeBadge pct={pct} />}
    </span>
  )
}
