import './EmptyState.css'

export default function EmptyState({ icon: Icon, title, children, action, tone = 'neutral' }) {
  return (
    <div className={`empty empty-${tone}`}>
      {Icon && (
        <span className="empty-icon">
          <Icon size={24} aria-hidden="true" />
        </span>
      )}
      <h3 className="empty-title">{title}</h3>
      {children && <p className="empty-text">{children}</p>}
      {action}
    </div>
  )
}
