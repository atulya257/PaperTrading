import './FullScreenLoader.css'

export default function FullScreenLoader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader-spinner" aria-hidden="true" />
      <p className="loader-label">{label}</p>
    </div>
  )
}
