import './StatTile.css'

export default function StatTile({ label, children, sub, hero = false, className = '' }) {
  return (
    <div className={`stat${hero ? ' stat-hero' : ''}${className ? ` ${className}` : ''}`}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{children}</p>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
