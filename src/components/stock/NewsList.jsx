import { Link } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import EmptyState from '../ui/EmptyState.jsx'
import Skeleton from '../ui/Skeleton.jsx'
import ChangeBadge from './ChangeBadge.jsx'
import { formatRelativeTime } from '../../utils/format.js'
import './NewsList.css'

export default function NewsList({ items, error, onRetry, emptyText = 'No news for this stock yet.', compact = false }) {
  if (error) {
    return (
      <EmptyState icon={Newspaper} tone="error" title="Could not load news">
        <button type="button" className="news-retry" onClick={onRetry}>
          Try again
        </button>
      </EmptyState>
    )
  }
  if (!items) {
    return (
      <div className="news-loading">
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} />
        <Skeleton height={14} width="60%" />
        <Skeleton height={12} />
      </div>
    )
  }
  if (items.length === 0) return <EmptyState icon={Newspaper} title={emptyText} />

  return (
    <ul className={`news-list${compact ? ' compact' : ''}`}>
      {items.map((n) => (
        <li key={n.id} className="news-item">
          <p className="news-headline">{n.headline}</p>
          {!compact && <p className="news-summary">{n.summary}</p>}
          <p className="news-meta">
            <span>{formatRelativeTime(n.publishedAt)}</span>
            {Number.isFinite(n.movePct) && (
              <span className="news-move">
                <ChangeBadge pct={n.movePct} size={12} /> simulated move
              </span>
            )}
            {n.symbols.map((symbol) => (
              <Link key={symbol} to={`/stock/${encodeURIComponent(symbol)}`} className="news-symbol num">
                {symbol}
              </Link>
            ))}
          </p>
        </li>
      ))}
    </ul>
  )
}
