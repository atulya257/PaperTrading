import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { formatPercent, trendOf } from '../../utils/format.js'
import './ChangeBadge.css'

const ICONS = { gain: ArrowUpRight, loss: ArrowDownRight, flat: Minus }
const WORDS = { gain: 'up', loss: 'down', flat: 'unchanged' }

export default function ChangeBadge({ pct, size = 14 }) {
  const trend = trendOf(pct)
  const Icon = ICONS[trend]
  return (
    <span className={`change ${trend} num`}>
      <Icon size={size} aria-hidden="true" />
      <span>{formatPercent(pct)}</span>
      <span className="sr-only"> ({WORDS[trend]})</span>
    </span>
  )
}
