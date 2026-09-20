import { Star } from 'lucide-react'
import { useAccount } from '../../context/AccountContext.jsx'
import { isWatched } from '../../engine/account.js'
import './WatchButton.css'

export default function WatchButton({ symbol, showLabel = false }) {
  const { account, toggleWatchlist } = useAccount()
  const watched = isWatched(account, symbol)
  const label = watched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`

  return (
    <button
      type="button"
      className={`watch-btn${watched ? ' watched' : ''}${showLabel ? ' with-label' : ''}`}
      aria-pressed={watched}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWatchlist(symbol)
      }}
    >
      <Star size={18} aria-hidden="true" fill={watched ? 'currentColor' : 'none'} />
      {showLabel && <span>{watched ? 'Watching' : 'Watch'}</span>}
    </button>
  )
}
