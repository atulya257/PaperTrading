import './EmptyState.css'

// A short, plain message for when there is nothing to show yet, with the next step underneath.
export default function EmptyState({ title, children, action, tone = 'neutral' }) {
  return (
    <div className={`empty empty-${tone}`}>
      <h3 className="empty-title">{title}</h3>
      {children && <p className="empty-text">{children}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}
