import { useMarketSnapshot } from '../../hooks/useMarketData.js'
import ChangeBadge from '../stock/ChangeBadge.jsx'
import './MarketPulse.css'

const fmtIndex = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MarketPulse() {
  const { index, mood, moodLabel, breadth } = useMarketSnapshot()
  const total = breadth.advancers + breadth.decliners + breadth.unchanged || 1
  const upShare = (breadth.advancers / total) * 100
  const downShare = (breadth.decliners / total) * 100
  const moodPosition = ((mood + 1) / 2) * 100

  return (
    <section className="pulse" aria-label="Market pulse">
      <div className="pulse-tile">
        <p className="pulse-label">TradeLab Index</p>
        <p className="pulse-value num">{fmtIndex(index.value)}</p>
        <p className="pulse-sub">
          <ChangeBadge pct={index.changePct} /> <span className="pulse-faint num">{index.change >= 0 ? '+' : ''}{fmtIndex(index.change)} pts</span>
        </p>
      </div>

      <div className="pulse-tile">
        <p className="pulse-label">Market mood</p>
        <p className="pulse-value">{moodLabel}</p>
        <div className="mood-track" role="img" aria-label={`Mood: ${moodLabel}, from bearish to bullish`}>
          <span className="mood-marker" style={{ left: `${moodPosition}%` }} />
        </div>
        <p className="pulse-sub pulse-faint mood-ends">
          <span>Bearish</span>
          <span>Bullish</span>
        </p>
      </div>

      <div className="pulse-tile">
        <p className="pulse-label">Breadth</p>
        <p className="pulse-value num">
          <span className="gain">{breadth.advancers}</span>
          <span className="pulse-faint"> up · </span>
          <span className="loss">{breadth.decliners}</span>
          <span className="pulse-faint"> down</span>
        </p>
        <div className="breadth-track" role="img" aria-label={`${breadth.advancers} advancing, ${breadth.decliners} declining, ${breadth.unchanged} unchanged`}>
          <span className="breadth-up" style={{ width: `${upShare}%` }} />
          <span className="breadth-down" style={{ width: `${downShare}%` }} />
        </div>
        <p className="pulse-sub pulse-faint">{breadth.unchanged} unchanged</p>
      </div>
    </section>
  )
}
